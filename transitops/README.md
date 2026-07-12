# 🚚 TransitOps — Smart Transport Operations Platform

An end-to-end platform to digitise vehicle, driver, dispatch, maintenance and
expense management — with business-rule enforcement, role-based access, a KPI
dashboard, charts, reports, licence OCR and email reminders.

Built for the Odoo hackathon brief (*TransitOps — Smart Transport Operations
Platform*). It **reuses the driving-licence OCR and Gmail reminder tools** from
the repo root instead of reinventing them.

---

## ⚡ Quick start (one command)

```bash
cd transitops
./run.sh
```

Then open **http://127.0.0.1:8010** in your browser.

> First run installs the Python dependencies and creates a seeded SQLite
> database automatically. No database server, no build step, no npm install.

### Demo logins (password: `transitops123`)

| Email | Role | Can manage |
|---|---|---|
| `admin@transitops.com`   | Admin            | Everything |
| `manager@transitops.com` | Fleet Manager    | Vehicles, maintenance, trips, everything ops |
| `driver@transitops.com`  | Driver           | Trips, fuel |
| `safety@transitops.com`  | Safety Officer   | Drivers, licence compliance, documents, reminders |
| `finance@transitops.com` | Financial Analyst| Expenses, fuel, reports |

(Use the **Quick demo login** buttons on the sign-in screen to auto-fill.)

---

## 🧩 Design-spec alignment (Schema / Metrics / Ratings / Dashboards PDFs)

The platform is structured to the four design PDFs in `transitops/`:

- **Schema** — 13 entities incl. `Incident`, vehicle-document expiry, plus fields
  for `acquisitionDate`, `serviceIntervalKm`, `lastServiceOdometer`,
  `plannedDuration`/`actualDistance`, maintenance `isPlanned`/ETA, expense
  categories `Toll/Fine/Parking/Other`.
- **RBAC permission matrix** — enforced server-side *and* reflected in the UI:
  - **Fleet Manager** owns trip create/dispatch/cancel, vehicle registry, maintenance.
  - **Driver** *completes* trips + logs fuel (no dispatch).
  - **Safety Officer** owns licence data, suspend/reinstate, safety score, **incidents**.
  - **Financial Analyst** owns expenses, trip revenue, acquisition cost, reports (read-only elsewhere).
- **Assignment algorithm** — the **✨ Suggest** button in the trip form hard-filters
  eligible vehicles/drivers (status, capacity, licence-category ↔ vehicle-type) then
  soft-scores them (capacity fit · safety · maintenance risk · fair rotation · idle time)
  and pre-selects the best pair. `POST /api/trips/suggest`.
- **Rating scores** — 1–3★ driver & vehicle ratings from the exact weighted formulas,
  shown as colour-banded stars in the tables. `GET /api/ratings/{drivers|vehicles}`.
- **Consolidated dashboard** — the 6 high-level metrics strip (Active Trips, Fleet
  Utilization, Compliance Rate, Net Profit, In Maintenance, Open Safety Flags) sits atop
  the detailed KPIs + charts. `GET /api/dashboard/overview`.
- **Extra algorithms** — dynamic **revenue suggestion** (distance × cargo × rate) and
  fuel/expense **anomaly detection** (>2σ outliers) on the Reports page.

### 🪪 OCR-driven driver creation
On **Add Driver**, upload a licence image and click **Scan & auto-fill** — your
`ocr_test.py` reads the licence number, category, expiry and name and fills the form,
so you never type the number by hand. (Oversized images are auto-shrunk under the
OCR.space 1 MB limit.)

---

## 🧱 Architecture

```
transitops/
├── run.sh                  # one-command launcher (installs deps, starts server)
├── backend/                # FastAPI + SQLAlchemy + SQLite
│   ├── requirements.txt
│   └── app/
│       ├── main.py         # app wiring, serves the frontend + /api
│       ├── config.py       # reads the repo-root .env (your OCR key + Gmail creds)
│       ├── database.py     # SQLite engine/session
│       ├── models.py       # Users, Roles, Vehicles, Drivers, Trips,
│       │                   #   Maintenance, Fuel, Expenses, Documents
│       ├── schemas.py      # Pydantic request/response models
│       ├── auth.py         # JWT + PBKDF2 passwords + RBAC
│       ├── business.py     # ★ every mandatory business rule + status transitions
│       ├── seed.py         # demo data (mirrors the PDF example workflow)
│       ├── routers/        # one module per resource (+ dashboard, reports,
│       │                   #   documents/OCR, reminders)
│       └── services/
│           ├── ocr_service.py    # bridges to ../../ocr_test.py  (your OCR)
│           ├── email_service.py  # bridges to ../../license_reminder.py (your Gmail)
│           └── export_service.py # CSV + PDF (reportlab)
└── frontend/               # responsive SPA — no build step
    ├── index.html          # Tailwind (CDN) + Chart.js (CDN)
    └── app.js              # all pages, forms, charts, dark mode
```

**Backend:** Python 3.11, FastAPI. **Frontend:** vanilla JS SPA served by the
backend (so there is only one thing to run). **DB:** SQLite (`backend/transitops.db`,
auto-created & seeded). Your existing `.env` at the repo root is reused for the
OCR key and Gmail credentials.

---

## ✅ How it maps to the brief

### Mandatory deliverables
| Requirement | Where |
|---|---|
| Responsive web interface | `frontend/` — works on mobile & desktop |
| Authentication with RBAC | `auth.py`, `routers/auth.py` (JWT, 5 roles) |
| CRUD for Vehicles & Drivers | `routers/vehicles.py`, `routers/drivers.py` + UI |
| Trip management with validations | `routers/trips.py` + `business.py` |
| Automatic status transitions | `business.py` (dispatch/complete/cancel/maintenance) |
| Maintenance workflow | `routers/maintenance.py` |
| Fuel & expense tracking | `routers/fuel.py`, `routers/expenses.py` |
| Dashboard with KPIs | `routers/dashboard.py` + Dashboard page |

### Mandatory business rules (all enforced server-side in `business.py`)
- ✅ Registration number is unique (DB constraint + friendly error)
- ✅ Retired / In-Shop vehicles never appear in dispatch selection
- ✅ Drivers with expired licence or Suspended status can't be assigned
- ✅ A vehicle/driver already **On Trip** can't be assigned again
- ✅ Cargo weight must not exceed the vehicle's max load capacity
- ✅ Dispatch → vehicle **and** driver become **On Trip**
- ✅ Complete → both back to **Available** (records odometer + fuel)
- ✅ Cancel a dispatched trip → both restored to **Available**
- ✅ Open maintenance → vehicle **In Shop** (hidden from dispatch)
- ✅ Close maintenance → vehicle **Available** (unless Retired)

### Bonus features (all included)
- 📈 **Charts** — fleet-status doughnut + cost/revenue bar (Chart.js)
- 📄 **PDF export** *and* CSV export of the analytics report (`/api/reports/export.*`)
- ✉️ **Email reminders** for expiring licences — reuses your `license_reminder.py`
- 🪪 **Document management + OCR** — upload a licence, your `ocr_test.py` extracts
  the fields and runs the Tier-2 authenticity checks; results shown in-app
- 🔎 **Search, filters, sorting** on every table + dashboard filters
- 🌙 **Dark mode** (remembers your choice)

### Reports & analytics formulas
- **Fuel Efficiency** = distance ÷ fuel (km/L)
- **Fleet Utilization** = vehicles On Trip ÷ active (non-retired) fleet
- **Operational Cost** = Fuel + Maintenance + other Expenses
- **Vehicle ROI** = (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost

---

## 🔗 Reuse of your existing tools

- `services/ocr_service.py` imports your **`ocr_test.py`** and calls
  `parse_license` / `validate_license` unchanged — the platform's licence
  verification *is* your OCR pipeline.
- `services/email_service.py` imports your **`license_reminder.py`** and uses its
  `build_message` / `send_email` — the "Licence Reminders" button pulls due
  drivers from the DB and sends through your Gmail sender.
- Both read the same repo-root **`.env`** you already configured
  (`OCR_SPACE_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`).

---

## 📡 API overview

`GET /docs` gives interactive Swagger docs. Key endpoints:

```
POST /api/auth/login-json           # {email, password} -> JWT
GET  /api/dashboard/kpis            # all KPI counters (+ type/status/region filters)
CRUD /api/vehicles                  # + /dispatchable (rule-filtered pool)
CRUD /api/drivers                   # + /dispatchable
GET  /api/trips  POST .../dispatch  .../complete  .../cancel
POST /api/maintenance   POST .../{id}/close
CRUD /api/fuel   CRUD /api/expenses
GET  /api/reports/summary  /api/reports/export.csv  /api/reports/export.pdf
POST /api/documents/scan-licence    # OCR only (no save)
POST /api/documents/upload          # store + OCR a document
GET  /api/reminders/due   POST /api/reminders/send
```

---

## 🛠️ Notes

- Default port is **8010** (port 8000 was already in use on this machine). Change
  with `PORT=9000 ./run.sh`.
- Tailwind and Chart.js load from CDN, so the browser needs internet on first
  paint. Everything else runs locally.
- To reset all data, stop the server and delete `backend/transitops.db` — it will
  be re-seeded on the next start.
```
