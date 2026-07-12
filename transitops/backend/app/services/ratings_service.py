"""Driver & Vehicle 1-3 star rating scores.

Implements the exact weighted-component formulas from the TransitOps Rating
Scores document. Computed on demand (fleet-wide context is needed for the
utilization / fuel-efficiency / ROI components), which keeps the app free of a
batch job while still being correct.
"""
from datetime import date, datetime, timedelta

from ..models import (Vehicle, Driver, Trip, FuelLog, MaintenanceLog, Incident,
                      TripStatus, DriverStatus, IncidentStatus)


def _stars(weighted):
    """Map a 0-1 weighted score onto 1.0-3.0 in 0.5 steps."""
    stars = round((1 + weighted * 2) * 2) / 2
    return max(1.0, min(3.0, stars))


def _band(stars):
    if stars >= 3.0:
        return "green"      # top performer
    if stars >= 2.0:
        return "amber"      # standard
    return "red"            # needs review


# ---------------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------------
def compute_all_driver_ratings(db):
    today = date.today()
    since90 = datetime.utcnow() - timedelta(days=90)
    out = {}
    for d in db.query(Driver).all():
        trips = d.trips
        completed = [t for t in trips if t.status == TripStatus.COMPLETED]
        cancelled = [t for t in trips if t.status == TripStatus.CANCELLED]

        safety = (d.safety_score or 0) / 100

        if d.status == DriverStatus.SUSPENDED or not d.license_expiry or d.license_expiry < today:
            compliance = 0.0
        elif d.license_expiry > today + timedelta(days=30):
            compliance = 1.0
        else:
            compliance = 0.5

        denom = len(completed) + len(cancelled)
        completion = (len(completed) / denom) if denom else 1.0

        ontime_eligible = [t for t in completed
                           if t.planned_duration and t.actual_duration is not None]
        if ontime_eligible:
            on_time = sum(1 for t in ontime_eligible
                          if t.actual_duration <= t.planned_duration * 1.15) / len(ontime_eligible)
        else:
            on_time = 1.0

        incidents90 = (db.query(Incident)
                       .filter(Incident.driver_id == d.id, Incident.occurred_at >= since90)
                       .count())
        incident_free = 1 - min(1.0, incidents90 / 3)

        weighted = (0.30 * safety + 0.20 * compliance + 0.20 * completion
                    + 0.15 * on_time + 0.15 * incident_free)
        stars = _stars(weighted)
        out[d.id] = {
            "driver_id": d.id, "name": d.name,
            "safety": round(safety, 2), "compliance": round(compliance, 2),
            "completion": round(completion, 2), "on_time": round(on_time, 2),
            "incident_free": round(incident_free, 2),
            "weighted_score": round(weighted, 3), "stars": stars, "band": _band(stars),
        }
    return out


# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------
def _dist_per_liter(v):
    liters = sum(f.liters for f in v.fuel_logs)
    dist = sum((t.actual_distance or 0) for t in v.trips if t.status == TripStatus.COMPLETED)
    return (dist / liters) if liters else 0.0


def _roi(v):
    fuel = sum(f.cost for f in v.fuel_logs)
    maint = sum(m.cost for m in v.maintenance_logs)
    revenue = sum(t.revenue for t in v.trips if t.status == TripStatus.COMPLETED)
    return ((revenue - (maint + fuel)) / v.acquisition_cost) if v.acquisition_cost else 0.0


def compute_all_vehicle_ratings(db):
    now = datetime.utcnow()
    since30 = now - timedelta(days=30)
    since180 = now - timedelta(days=180)
    vehicles = db.query(Vehicle).all()

    # Fleet-wide reference values
    trips30 = {v.id: sum(1 for t in v.trips
                         if t.status == TripStatus.COMPLETED and t.completed_at and t.completed_at >= since30)
               for v in vehicles}
    fleet_avg_trips = (sum(trips30.values()) / len(vehicles)) if vehicles else 0
    dpl = {v.id: _dist_per_liter(v) for v in vehicles}
    nonzero_dpl = [x for x in dpl.values() if x > 0]
    fleet_avg_dpl = (sum(nonzero_dpl) / len(nonzero_dpl)) if nonzero_dpl else 0
    rois = {v.id: _roi(v) for v in vehicles}
    roi_min, roi_max = (min(rois.values()), max(rois.values())) if rois else (0, 0)

    out = {}
    for v in vehicles:
        interval = v.service_interval_km or 10000
        used = (v.odometer or 0) - (v.last_service_odometer or 0)
        maintenance = 1 - min(1.0, max(0.0, used) / interval)

        utilization = min(1.0, trips30[v.id] / fleet_avg_trips) if fleet_avg_trips else 0.0
        fuel_eff = min(1.0, dpl[v.id] / fleet_avg_dpl) if fleet_avg_dpl else 0.0

        unplanned = (db.query(MaintenanceLog)
                     .filter(MaintenanceLog.vehicle_id == v.id,
                             MaintenanceLog.is_planned == False,  # noqa: E712
                             MaintenanceLog.created_at >= since180)
                     .count())
        breakdown = 1 - min(1.0, unplanned / 3)

        roi_c = ((rois[v.id] - roi_min) / (roi_max - roi_min)) if roi_max > roi_min else 0.5

        weighted = (0.30 * maintenance + 0.20 * utilization + 0.20 * fuel_eff
                    + 0.15 * breakdown + 0.15 * roi_c)
        stars = _stars(weighted)
        out[v.id] = {
            "vehicle_id": v.id, "registration_number": v.registration_number,
            "maintenance": round(maintenance, 2), "utilization": round(utilization, 2),
            "fuel_efficiency": round(fuel_eff, 2), "breakdown": round(breakdown, 2),
            "roi": round(roi_c, 2),
            "weighted_score": round(weighted, 3), "stars": stars, "band": _band(stars),
        }
    return out
