# TransitOps — Smart Transport Operations Platform

TransitOps is an end-to-end platform designed to digitise vehicle, driver, dispatch, maintenance, and expense management. It features business-rule enforcement, role-based access control (RBAC), custom KPI dashboards, charts, reports, automated license OCR, and email reminders.

This application has been redesigned to be modern, clean, and professional—without emojis or visual clutter.

---

## Quick Start (One Command)

To run the application, navigate to the `TransitOps` directory and execute the launcher script:

```bash
cd TransitOps
./run.sh
```

Then, open **http://127.0.0.1:8010** in your browser.

*Note: The launcher will automatically configure the Python virtual environment, install backend requirements, and set up a seeded SQLite database on first run.*

### Demo Accounts
You can sign in using any of the following accounts (password: `transitops123`):

*   **Fleet Manager**: `manager@transitops.com`
*   **Driver**: `driver@transitops.com`
*   **Safety Officer**: `safety@transitops.com`
*   **Financial Analyst**: `finance@transitops.com`
*   **Admin**: `admin@transitops.com`

---

## System Architecture

```
TransitOps/
├── backend/                # FastAPI + SQLAlchemy + SQLite
│   ├── app/
│   │   ├── main.py         # App initialization & routing
│   │   ├── models.py       # SQLAlchemy database schemas
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── seed.py         # Database seeder (rich mock data)
│   │   ├── business.py     # Business rule validations
│   │   ├── routers/        # API endpoints grouped by resource
│   │   └── services/       # Core services (OCR, Email, Export)
│   └── requirements.txt    # Python dependencies
├── frontend/               # Single Page Application (SPA)
│   ├── index.html          # HTML shell (Inter font, CDN Chart.js & Heroicons)
│   ├── style.css           # Custom CSS styling (clean slate theme)
│   └── app.js              # Complete SPA routing & view renders
├── ALGORITHMS.md           # Technical details of the scoring & math rules
├── run.sh                  # One-command system launcher
└── .env                    # Shared API Keys and credentials
```

---

## Core Features & Role Dashboards

TransitOps separates features and navigation dynamically by user role:

### 1. Fleet Manager (6 Pages)
*   **Dashboard**: Utilization metric gauges, fleet status distribution charts, and idle vehicle alerts.
*   **Trip Board**: Create and dispatch trips with smart assignment suggestions (based on capacity, safety, and rotation).
*   **Vehicle Registry**: CRUD operations for registering, updating, and retiring fleet assets.
*   **Maintenance Logs**: Manage planned services or log vehicle breakdowns (automatically controls vehicle shop status).
*   **Vehicle Documents**: Tracks expiration dates for insurance, permits, and registration documents.
*   **Driver Roster**: Read-only directory tracking active drivers and their categories.

### 2. Driver (4 Pages)
*   **My Trips**: Log active tasks and view completed trip history.
*   **Trip Execution**: Submit odometer range and fuel consumption to complete dispatched trips.
*   **My Vehicle**: Read-only status report of the last assigned vehicle.
*   **My Profile**: Expiry countdowns and safety ratings.
*   *Note: Drivers can self-register using the sign-up tab on the login screen.*

### 3. Safety Officer (4 Pages)
*   **Compliance Board**: Visual charts for driver compliance rate, upcoming license expiration buckets (30/60/90 days), and suspended lists.
*   **Driver Directory**: Verify and edit license data, with quick actions to suspend or reinstate drivers.
*   **Safety Ratings**: Driver safety leaderboard with weighted star ratings.
*   **Incident Log**: Track accidents, collisions, or traffic violations against drivers.

### 4. Financial Analyst (5 Pages)
*   **Financial Dashboard**: Net profit, vehicle ROI rankings, operational cost breakdowns, and automatic cost-per-liter outlier flags.
*   **Revenue & Costs**: Record collected revenue per completed trip, with dynamic basis suggestions.
*   **Fuel & Expenses**: Log non-fuel operational costs (tolls, fines, parking).
*   **Maintenance Cost**: Read-only breakdown of repair and service costs.
*   **Reports & Export**: Export full fleet stats to CSV or PDF.

### 5. Admin (1 Page)
*   **Overview**: Admin settings, system overview, user list, and database connections.

---

## Core Algorithms Implemented

TransitOps implements five custom business algorithms:
1.  **Smart Trip Assignment**: Hard-filters drivers and vehicles for eligibility, then soft-scores candidates using capacity fit, safety records, maintenance risk, rotation, and idle time.
2.  **Driver Performance Rating**: Computes a 1–3 star performance rating based on compliance, completion reliability, safety records, on-time rates, and incident-free history.
3.  **Vehicle Health Rating**: Evaluates vehicle wear, utilization, fuel efficiency vs fleet peers, unplanned breakdowns, and ROI contribution to score assets (1–3 stars).
4.  **Financial Anomaly Detection**: Automatically flags fuel cost-per-liter or expense amount entries that are more than 2 standard deviations away from the historical vehicle/category average.
5.  **Dynamic Revenue Suggestion**: Auto-populates expected trip revenue based on distance, cargo weight, and a configurable base rate.

For detailed formulas, weights, and technical pseudocode, refer to [ALGORITHMS.md](ALGORITHMS.md).
