import statistics

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import (Vehicle, Trip, FuelLog, MaintenanceLog, Expense,
                      TripStatus, User)
from ..services import export_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/suggest-revenue")
def suggest_revenue(distance: float = Query(0), cargo: float = Query(0),
                    rate: float = Query(0.08), _: User = Depends(get_current_user)):
    """Dynamic revenue suggestion: distance × cargo × per-kg-km rate.
    The Financial Analyst can still override the value."""
    suggested = round(distance * cargo * rate, 2)
    return {"suggested_revenue": suggested, "rate": rate,
            "basis": f"{distance:g} km × {cargo:g} kg × ₹{rate}/kg·km"}


@router.get("/anomalies")
def anomalies(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Flag fuel logs / expenses that are > 2 standard deviations from the
    relevant rolling average — catches data-entry errors or possible fraud."""
    flags = []

    # Fuel: cost-per-litre outliers, grouped per vehicle
    by_vehicle = {}
    for f in db.query(FuelLog).all():
        if f.liters and f.liters > 0:
            by_vehicle.setdefault(f.vehicle_id, []).append((f, f.cost / f.liters))
    for vid, rows in by_vehicle.items():
        if len(rows) < 3:
            continue
        cpls = [c for _, c in rows]
        mean, sd = statistics.mean(cpls), statistics.pstdev(cpls)
        if sd == 0:
            continue
        veh = db.query(Vehicle).get(vid)
        for f, cpl in rows:
            if cpl > mean + 2 * sd:
                flags.append({
                    "type": "Fuel", "id": f.id,
                    "vehicle": veh.registration_number if veh else vid,
                    "detail": f"₹{cpl:.1f}/L vs avg ₹{mean:.1f}/L on {f.log_date}",
                })

    # Expense: amount outliers, grouped per category
    by_cat = {}
    for e in db.query(Expense).all():
        by_cat.setdefault(e.category, []).append(e)
    for cat, rows in by_cat.items():
        if len(rows) < 3:
            continue
        amts = [e.amount for e in rows]
        mean, sd = statistics.mean(amts), statistics.pstdev(amts)
        if sd == 0:
            continue
        for e in rows:
            if e.amount > mean + 2 * sd:
                flags.append({
                    "type": "Expense", "id": e.id, "vehicle": cat,
                    "detail": f"₹{e.amount:.0f} vs avg ₹{mean:.0f} for {cat}",
                })

    return {"count": len(flags), "flags": flags}


def _vehicle_metrics(db: Session):
    """Per-vehicle analytics: fuel efficiency, operational cost, revenue, ROI."""
    rows = []
    for v in db.query(Vehicle).all():
        fuel_liters = sum(f.liters for f in v.fuel_logs)
        fuel_cost = sum(f.cost for f in v.fuel_logs)
        maint_cost = sum(m.cost for m in v.maintenance_logs)
        expense_cost = sum(e.amount for e in v.expenses)

        completed = [t for t in v.trips if t.status == TripStatus.COMPLETED]
        distance = sum((t.final_odometer - t.start_odometer)
                       for t in completed
                       if t.final_odometer is not None and t.start_odometer is not None)
        revenue = sum(t.revenue for t in completed)

        operational_cost = fuel_cost + maint_cost + expense_cost
        efficiency = round(distance / fuel_liters, 2) if fuel_liters else 0.0
        roi = round((revenue - (maint_cost + fuel_cost)) / v.acquisition_cost, 3) \
            if v.acquisition_cost else 0.0

        rows.append({
            "registration_number": v.registration_number,
            "name": v.name,
            "type": v.type,
            "status": v.status,
            "distance_km": round(distance, 1),
            "fuel_liters": round(fuel_liters, 1),
            "fuel_efficiency_km_per_l": efficiency,
            "fuel_cost": round(fuel_cost, 2),
            "maintenance_cost": round(maint_cost, 2),
            "other_expenses": round(expense_cost, 2),
            "operational_cost": round(operational_cost, 2),
            "revenue": round(revenue, 2),
            "acquisition_cost": round(v.acquisition_cost, 2),
            "roi": roi,
            "completed_trips": len(completed),
        })
    return rows


@router.get("/summary")
def summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = _vehicle_metrics(db)
    fleet_fuel = sum(r["fuel_cost"] for r in rows)
    fleet_maint = sum(r["maintenance_cost"] for r in rows)
    fleet_other = sum(r["other_expenses"] for r in rows)
    fleet_revenue = sum(r["revenue"] for r in rows)
    fleet_distance = sum(r["distance_km"] for r in rows)
    fleet_liters = sum(r["fuel_liters"] for r in rows)
    return {
        "vehicles": rows,
        "totals": {
            "operational_cost": round(fleet_fuel + fleet_maint + fleet_other, 2),
            "fuel_cost": round(fleet_fuel, 2),
            "maintenance_cost": round(fleet_maint, 2),
            "other_expenses": round(fleet_other, 2),
            "revenue": round(fleet_revenue, 2),
            "net": round(fleet_revenue - (fleet_fuel + fleet_maint + fleet_other), 2),
            "fleet_efficiency_km_per_l": round(fleet_distance / fleet_liters, 2) if fleet_liters else 0.0,
            "total_distance_km": round(fleet_distance, 1),
        },
    }


REPORT_COLUMNS = [
    "registration_number", "name", "type", "status", "distance_km",
    "fuel_liters", "fuel_efficiency_km_per_l", "fuel_cost", "maintenance_cost",
    "other_expenses", "operational_cost", "revenue", "acquisition_cost", "roi",
    "completed_trips",
]


@router.get("/export.csv")
def export_csv(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = _vehicle_metrics(db)
    csv_text = export_service.to_csv(rows, REPORT_COLUMNS)
    return Response(
        content=csv_text, media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transitops_report.csv"},
    )


@router.get("/export.pdf")
def export_pdf(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = _vehicle_metrics(db)
    # keep the PDF readable — a focused subset of columns
    pdf_cols = ["registration_number", "type", "status", "distance_km",
                "fuel_efficiency_km_per_l", "operational_cost", "revenue", "roi"]
    pdf_bytes = export_service.to_pdf("Fleet Analytics Report", rows, pdf_cols)
    return Response(
        content=pdf_bytes, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=transitops_report.pdf"},
    )
