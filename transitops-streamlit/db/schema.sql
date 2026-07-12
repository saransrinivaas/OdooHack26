-- =====================================================================
-- TransitOps schema: profiles (roles) + drivers (safety/compliance)
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles: one row per auth.users row, carries the TransitOps role
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    role text not null check (role in ('fleet_manager','driver','safety_officer','financial_analyst')),
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Every logged-in user can read their own profile (needed right after login
-- to know which dashboard/role to route them to).
create policy "profiles_select_own"
    on public.profiles for select
    using (auth.uid() = id);

-- A user may create their own profile row once, during signup.
create policy "profiles_insert_own"
    on public.profiles for insert
    with check (auth.uid() = id);

-- Small helper used by every RLS policy below: "does the current user have
-- this TransitOps role?"
create or replace function public.has_role(target_role text)
returns boolean
language sql
security definer
stable
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and role = target_role
    );
$$;

-- ---------------------------------------------------------------------
-- 2. drivers: license, safety score, dispatch status
-- ---------------------------------------------------------------------
create table if not exists public.drivers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    name text not null,
    license_number text not null unique,
    license_category text not null default 'lmv'
        check (license_category in ('lmv','hmv','mc','other')),
    license_expiry_date date not null,
    contact_number text,
    safety_score numeric(5,2) not null default 100
        check (safety_score >= 0 and safety_score <= 100),
    status text not null default 'off_duty'
        check (status in ('available','on_trip','off_duty','suspended')),
    suspension_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.drivers enable row level security;

-- Safety Officers & Fleet Managers: full visibility.
create policy "drivers_select_management"
    on public.drivers for select
    using (public.has_role('safety_officer') or public.has_role('fleet_manager')
           or public.has_role('financial_analyst'));

-- Drivers: can see only their own row.
create policy "drivers_select_own"
    on public.drivers for select
    using (user_id = auth.uid());

-- A newly-signed-up driver may create their own placeholder driver row.
create policy "drivers_insert_own"
    on public.drivers for insert
    with check (user_id = auth.uid());

-- Fleet Managers can create any driver record (e.g. onboarding on their behalf).
create policy "drivers_insert_fleet_manager"
    on public.drivers for insert
    with check (public.has_role('fleet_manager'));

-- Safety Officers & Fleet Managers can update any driver
-- (status changes, suspend/reactivate, safety score updates).
create policy "drivers_update_management"
    on public.drivers for update
    using (public.has_role('safety_officer') or public.has_role('fleet_manager'))
    with check (public.has_role('safety_officer') or public.has_role('fleet_manager'));

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_drivers_updated_at on public.drivers;
create trigger trg_drivers_updated_at
    before update on public.drivers
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. driver_compliance: read-only view with computed compliance fields
--    (kept as a view, not a stored column, since it depends on today's date)
-- ---------------------------------------------------------------------
create or replace view public.driver_compliance as
select
    d.*,
    (d.license_expiry_date < current_date) as is_license_expired,
    (d.license_expiry_date - current_date) as days_to_license_expiry,
    case
        when d.status = 'suspended' or d.license_expiry_date < current_date then 'critical'
        when (d.license_expiry_date - current_date) <= 30 then 'warning'
        else 'ok'
    end as compliance_flag
from public.drivers d;

-- Views inherit the RLS of their underlying table automatically when
-- security_invoker is set (Postgres 15+ / Supabase default).
alter view public.driver_compliance set (security_invoker = true);
