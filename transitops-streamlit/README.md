# TransitOps — Login/Signup + Safety Officer Dashboard (Streamlit + Supabase)

Your piece of the hackathon build, on the stack the team picked: **Streamlit**
for UI, **Supabase** (Postgres + Auth) for the backend, plain **Python** in
between. Teammates building Vehicles/Trips/Maintenance/Fuel can add their own
`views/*.py` + `services/*.py` files and plug into `app.py`'s router the same
way `safety_dashboard_view` does.

## What's inside

```
transitops-streamlit/
├── app.py                      # entry point: auth gate + role-based routing
├── requirements.txt
├── .streamlit/
│   └── secrets.toml.example    # copy -> secrets.toml, fill in your Supabase keys
├── db/
│   └── schema.sql              # tables + RLS policies + compliance view
├── auth/
│   ├── supabase_client.py      # per-session Supabase client
│   └── service.py              # sign_up / sign_in / sign_out / role helpers
├── services/
│   └── driver_service.py       # driver queries, KPIs, suspend/reactivate
└── views/
    ├── login_view.py           # login/signup UI (role picker included)
    └── safety_dashboard_view.py
```

## 1. Create the Supabase project

1. Go to https://supabase.com → New project. Pick a name/region, set a DB password (save it).
2. Once it's provisioned, open **SQL Editor** → New query → paste the entire contents of `db/schema.sql` → Run.
   This creates `profiles`, `drivers`, RLS policies, and the `driver_compliance` view used by the dashboard.
3. Go to **Project Settings → API**. You'll need:
   - **Project URL** (`SUPABASE_URL`)
   - **anon public key** (`SUPABASE_KEY`) — not the service_role key.
4. (Optional but recommended for a hackathon demo) Go to **Authentication → Providers → Email** and turn off "Confirm email" so signups log straight in without needing to click an email link.

## 2. Local setup (Windows)

```cmd
:: Python 3.10+ from python.org, "Add to PATH" checked during install
python --version

cd C:\Users\vishnu
git clone https://github.com/<your-org>/<transitops-repo>.git
cd <transitops-repo>

:: if this module isn't in the repo yet, copy it in first (see step 4)

cd transitops-streamlit
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Set up your secrets:
```cmd
mkdir .streamlit 2>nul
copy .streamlit\secrets.toml.example .streamlit\secrets.toml
notepad .streamlit\secrets.toml
```
Paste in your `SUPABASE_URL` and `SUPABASE_KEY` from step 1. **Do not commit this file** — it's already in `.gitignore`.

## 3. Run it

```cmd
venv\Scripts\activate
streamlit run app.py
```

Browser opens automatically at `http://localhost:8501`.

## 4. Check it works

1. On the **Sign up** tab: enter a name/email/password, pick role **Safety Officer**, create the account.
2. You should land straight on the **Safety & Compliance Dashboard** (or, if email confirmation is still on, confirm the email then log in).
3. Open a second incognito window, sign up again with role **Fleet Manager** — Fleet Managers also see the Safety Dashboard.
4. To populate real data: in Supabase → **Table Editor → drivers**, add a couple of rows manually with different `license_expiry_date` / `status` values (e.g. one expiring in 10 days, one already expired, one `suspended`).
5. Back in the app, hit **↻ Refresh** — confirm the KPI cards, the color-coded compliance table, and the **Suspend / Reactivate** buttons all work. Try reactivating a driver with an expired license — it should be blocked with an error message (the business rule enforced in `driver_service.reactivate_driver`).

## Business rules implemented here

- `license_number` is `unique` at the DB level (`db/schema.sql`).
- `driver_compliance` view computes `is_license_expired`, `days_to_license_expiry`, and `compliance_flag` (`ok` / `warning` / `critical`) live, so it's always correct against "today," not a stale stored value.
- `reactivate_driver()` blocks reactivation while the license is expired — mirrors the rule *"expired license or Suspended ⇒ cannot be assigned to a trip."* Your teammate's Trip/Dispatch code should query `driver_compliance` and check `compliance_flag != 'critical' and status == 'available'` before allowing dispatch.
- RLS policies in `db/schema.sql` are the actual enforcement layer for RBAC — Fleet Manager/Safety Officer can read & update all drivers; a Driver can only read their own row; anyone can create their own profile/driver row once at signup.

## 5. Push to the shared repo

```cmd
git checkout -b feature/auth-safety-dashboard

:: copy this whole folder into wherever your team keeps app code, e.g.:
xcopy /E /I transitops-streamlit ..\transitops-repo\transitops-streamlit

cd ..\transitops-repo
git add transitops-streamlit
git commit -m "Add Supabase-backed login/signup and Safety Officer dashboard (Streamlit)"
git push -u origin feature/auth-safety-dashboard
```

Then open the PR on GitHub.

**Tell your team before merging:**
- Everyone should point at the **same Supabase project** (share the URL/anon key out of band, e.g. a team chat pin — never commit them).
- Reuse the `profiles.role` values (`fleet_manager`, `driver`, `safety_officer`, `financial_analyst`) and the `has_role()` SQL helper for any new tables (vehicles, trips, maintenance, fuel logs) so RBAC stays consistent across the whole app.
- If someone builds Vehicles/Trips as more Streamlit views, wire them into `app.py`'s `render_main()` the same way `safety_dashboard_view` is wired in.
