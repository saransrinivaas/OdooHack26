# TransitOps — Algorithm Reference

This document explains every algorithm implemented in TransitOps: what it does, how it works, and the exact formulas used.

---

## 1. Trip Assignment Algorithm

**Where:** `POST /api/trips/suggest`  
**Purpose:** When a Fleet Manager creates a trip, the system suggests the best vehicle + driver pair, pre-filling the form. The manager can still override any choice from a dropdown of all eligible options.

### Step 1 — Hard Filters (mandatory)

These candidates are excluded entirely from the list:

| Check | Rule |
|---|---|
| Vehicle status | Must be `Available` (not On Trip, In Shop, or Retired) |
| Vehicle capacity | `maxLoadCapacity >= trip.cargoWeight` |
| Driver status | Must be `Available` (not On Trip, Off Duty, or Suspended) |
| Driver license | `licenseExpiryDate > today` |
| License category | Must be compatible with the vehicle type (e.g. HMV required for trucks) |

### Step 2 — Soft Scoring (ranking)

Each valid `(vehicle, driver)` pair receives a score from 0 to 1:

| Factor | Formula | Weight | Rationale |
|---|---|---|---|
| **Capacity fit** | `1 - abs(maxLoad - cargo) / maxLoad` | 0.30 | Prefers right-sized vehicles over always picking the biggest truck |
| **Driver safety score** | `driver.safetyScore / 100` | 0.25 | Prefers safer drivers when multiple are eligible |
| **Maintenance risk** | `1 - min(1, (odometer - lastServiceOdometer) / serviceIntervalKm)` | 0.20 | Avoids vehicles near their next scheduled service |
| **Fair rotation** | `1 - (tripsToday / maxTripsToday across all eligible drivers)` | 0.15 | Distributes trips evenly rather than always picking the same driver |
| **Idle time bonus** | `min(1, hoursSinceLastTrip / 24)` for the vehicle | 0.10 | Slightly favors vehicles that have been sitting idle longest |

```
TotalScore = 0.30 × CapacityFit
           + 0.25 × SafetyScore
           + 0.20 × MaintenanceRisk
           + 0.15 × FairRotation
           + 0.10 × IdleBonus
```

The pair with the highest `TotalScore` is pre-selected in the form. The Fleet Manager sees the full eligible list in each dropdown and can override.

---

## 2. Driver Rating Algorithm (1–3 stars)

**Where:** `GET /api/ratings/drivers`  
**Purpose:** A single star rating (1.0 to 3.0, in 0.5 steps) for each driver, visible to Fleet Managers and Safety Officers. Also feeds the assignment algorithm's safety factor.

### Components

| Component | Formula | Weight |
|---|---|---|
| **Safety score** | `driver.safetyScore / 100` | 0.30 |
| **License compliance** | `1.0` if >30 days to expiry, `0.5` if within 30 days, `0.0` if expired or suspended | 0.20 |
| **Completion reliability** | `completedTrips / (completedTrips + cancelledTrips)` | 0.20 |
| **On-time rate** | Trips where `actualDuration ≤ plannedDuration × 1.15` / total completed | 0.15 |
| **Incident-free rate** | `1 - min(1, incidentsLast90Days / 3)` | 0.15 |

```
WeightedScore = 0.30 × Safety
              + 0.20 × LicenseCompliance
              + 0.20 × CompletionReliability
              + 0.15 × OnTimeRate
              + 0.15 × IncidentFreeRate

StarRating = ROUND((1 + WeightedScore × 2) × 2) / 2
             → maps 0 → 1 star, 0.5 → 2 stars, 1.0 → 3 stars
```

### Display Bands

| Stars | Color | Meaning |
|---|---|---|
| 3.0 | Green | Top performer |
| 2.0–2.5 | Amber | Standard |
| Below 2.0 | Red | Needs review |

---

## 3. Vehicle Rating Algorithm (1–3 stars)

**Where:** `GET /api/ratings/vehicles`  
**Purpose:** A single star health/performance rating for each vehicle. Feeds the assignment algorithm's maintenance risk factor and gives Fleet Managers and Financial Analysts a shared quality reference.

### Components

| Component | Formula | Weight |
|---|---|---|
| **Maintenance health** | `1 - min(1, (odometer - lastServiceOdometer) / serviceIntervalKm)` | 0.30 |
| **Utilization efficiency** | `tripsLast30Days / fleetAvgTripsLast30Days`, capped at 1 | 0.20 |
| **Fuel efficiency vs fleet** | `vehicleDistPerLiter / fleetAvgDistPerLiter`, capped at 1 | 0.20 |
| **Breakdown frequency** | `1 - min(1, unplannedMaintenanceLast180Days / 3)` | 0.15 |
| **ROI contribution** | Min-max normalized ROI across the fleet, scaled 0–1 | 0.15 |

```
WeightedScore = 0.30 × MaintenanceHealth
              + 0.20 × UtilizationEfficiency
              + 0.20 × FuelEfficiencyVsFleet
              + 0.15 × BreakdownFrequency
              + 0.15 × ROIContribution

StarRating = ROUND((1 + WeightedScore × 2) × 2) / 2
```

Same 1–3 star / green–amber–red display bands as the driver rating.

---

## 4. Anomaly Detection

**Where:** `GET /api/reports/anomalies`  
**Purpose:** Flags fuel log entries or expense entries that look suspiciously high — either a data entry mistake or a potential fraud indicator.

### Method

For **fuel logs**, anomalies are detected per vehicle:
1. Calculate `cost_per_litre` for every fuel log entry of that vehicle.
2. Compute the mean and standard deviation of those values.
3. Flag any entry where `cost_per_litre > mean + 2 × stddev`.

For **expenses**, anomalies are detected per expense category:
1. Calculate mean and standard deviation of `amount` within each category (Toll, Fine, Parking, Other).
2. Flag any entry where `amount > mean + 2 × stddev`.

Requires at least 3 data points in a group before flagging (to avoid false positives with too little history).

---

## 5. Dynamic Revenue Suggestion

**Where:** `GET /api/reports/suggest-revenue?distance=&cargo=&rate=`  
**Purpose:** Pre-fills the trip revenue field with a reasonable estimate instead of leaving it blank.

### Formula

```
SuggestedRevenue = distance (km) × cargoWeight (kg) × ratePerKgKm (₹)
```

Default rate: `₹0.08 per kg per km`. The Financial Analyst can adjust the rate parameter.

**Example:** A 350 km trip carrying 6,000 kg → `350 × 6000 × 0.08 = ₹168,000`

This is a suggestion only — the manager or financial analyst always confirms or overrides the final value.
