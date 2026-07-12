import streamlit as st

from services.driver_service import (
    fetch_drivers,
    compute_kpis,
    suspend_driver,
    reactivate_driver,
    STATUS_LABELS,
)

STATUS_COLOR = {
    "available": "green",
    "on_trip": "blue",
    "off_duty": "gray",
    "suspended": "red",
}
COMPLIANCE_COLOR = {"ok": "green", "warning": "orange", "critical": "red"}


def render():
    st.markdown("## 🛡️ Safety &amp; Compliance Dashboard", unsafe_allow_html=True)

    if st.button("↻ Refresh", help="Reload driver data from Supabase"):
        st.cache_data.clear()

    df = fetch_drivers()
    kpis = compute_kpis(df)

    row1 = st.columns(4)
    row1[0].metric("Total Drivers", kpis["total"])
    row1[1].metric("Available", kpis["available"])
    row1[2].metric("On Trip", kpis["on_trip"])
    row1[3].metric("Suspended", kpis["suspended"])

    row2 = st.columns(4)
    row2[0].metric("Off Duty", kpis["off_duty"])
    row2[1].metric("License Expiring ≤30d", kpis["expiring_soon"])
    row2[2].metric("Expired Licenses", kpis["expired"])
    row2[3].metric("Avg Safety Score", f"{kpis['avg_safety_score']}%")

    st.divider()

    if df.empty:
        st.info("No drivers yet. Ask a Fleet Manager to add driver records.")
        return

    status_filter = st.selectbox(
        "Filter by status",
        options=["all"] + list(STATUS_LABELS.keys()),
        format_func=lambda s: "All statuses" if s == "all" else STATUS_LABELS[s],
    )
    view_df = df if status_filter == "all" else df[df["status"] == status_filter]

    st.caption(f"Showing {len(view_df)} of {len(df)} drivers")

    header = st.columns([2, 2, 2, 1, 1, 1.2, 1.2, 1.3])
    for col, label in zip(
        header,
        ["Driver", "License No.", "Expiry", "Days Left", "Safety", "Status", "Compliance", "Action"],
    ):
        col.markdown(f"**{label}**")

    for _, d in view_df.iterrows():
        cols = st.columns([2, 2, 2, 1, 1, 1.2, 1.2, 1.3])
        cols[0].write(d["name"])
        cols[1].write(d["license_number"])
        cols[2].write(str(d["license_expiry_date"]))
        cols[3].markdown(
            f":{'red' if d['days_to_license_expiry'] < 0 else 'orange' if d['days_to_license_expiry'] <= 30 else 'gray'}"
            f"[{int(d['days_to_license_expiry'])}]"
        )
        cols[4].write(f"{d['safety_score']:.0f}")
        cols[5].markdown(f":{STATUS_COLOR.get(d['status'], 'gray')}[{d['status_label']}]")
        cols[6].markdown(f":{COMPLIANCE_COLOR.get(d['compliance_flag'], 'gray')}[{d['compliance_flag']}]")

        if d["status"] != "suspended":
            if cols[7].button("Suspend", key=f"suspend_{d['id']}"):
                suspend_driver(d["id"], reason="Suspended from Safety Dashboard")
                st.rerun()
        else:
            if cols[7].button("Reactivate", key=f"reactivate_{d['id']}"):
                ok, message = reactivate_driver(d["id"])
                if ok:
                    st.rerun()
                else:
                    st.error(message)
