from datetime import date

import pandas as pd
import streamlit as st

from auth.supabase_client import get_supabase_client

STATUS_LABELS = {
    "available": "Available",
    "on_trip": "On Trip",
    "off_duty": "Off Duty",
    "suspended": "Suspended",
}


def fetch_drivers() -> pd.DataFrame:
    """Reads from the driver_compliance VIEW, which already computes
    is_license_expired / days_to_license_expiry / compliance_flag."""
    sb = get_supabase_client()
    result = (
        sb.table("driver_compliance")
        .select("*")
        .order("days_to_license_expiry", desc=False)
        .execute()
    )
    df = pd.DataFrame(result.data)
    if df.empty:
        return df
    df["status_label"] = df["status"].map(STATUS_LABELS).fillna(df["status"])
    return df


def compute_kpis(df: pd.DataFrame) -> dict:
    if df.empty:
        return {
            "total": 0, "available": 0, "on_trip": 0, "off_duty": 0,
            "suspended": 0, "expiring_soon": 0, "expired": 0, "avg_safety_score": 0,
        }
    return {
        "total": len(df),
        "available": int((df["status"] == "available").sum()),
        "on_trip": int((df["status"] == "on_trip").sum()),
        "off_duty": int((df["status"] == "off_duty").sum()),
        "suspended": int((df["status"] == "suspended").sum()),
        "expiring_soon": int((df["compliance_flag"] == "warning").sum()),
        "expired": int((df["compliance_flag"] == "critical").sum()),
        "avg_safety_score": round(float(df["safety_score"].mean()), 1),
    }


def suspend_driver(driver_id: str, reason: str = ""):
    sb = get_supabase_client()
    sb.table("drivers").update(
        {"status": "suspended", "suspension_reason": reason or None}
    ).eq("id", driver_id).execute()


def reactivate_driver(driver_id: str) -> tuple[bool, str]:
    """Business rule: a driver whose license is currently expired cannot be
    reactivated until the license is renewed."""
    sb = get_supabase_client()
    row = sb.table("driver_compliance").select("*").eq("id", driver_id).execute()
    if not row.data:
        return False, "Driver not found."
    driver = row.data[0]
    if driver["is_license_expired"]:
        return False, "Cannot reactivate: license is expired. Update the expiry date first."

    sb.table("drivers").update(
        {"status": "available", "suspension_reason": None}
    ).eq("id", driver_id).execute()
    return True, "Driver reactivated."


def update_license(driver_id: str, license_number: str, license_category: str,
                    license_expiry_date: date, contact_number: str = ""):
    sb = get_supabase_client()
    sb.table("drivers").update(
        {
            "license_number": license_number,
            "license_category": license_category,
            "license_expiry_date": license_expiry_date.isoformat(),
            "contact_number": contact_number or None,
        }
    ).eq("id", driver_id).execute()
