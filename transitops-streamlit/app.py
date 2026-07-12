import streamlit as st

from auth.service import is_logged_in, current_role, sign_out, ROLE_LABELS
from views import login_view, safety_dashboard_view

st.set_page_config(page_title="TransitOps", page_icon="🚚", layout="wide")


def render_sidebar():
    profile = st.session_state.profile
    with st.sidebar:
        st.markdown(f"### 🚚 TransitOps")
        st.write(f"**{profile['full_name']}**")
        st.caption(ROLE_LABELS.get(profile["role"], profile["role"]))
        st.divider()
        if st.button("Log out", use_container_width=True):
            sign_out()
            st.rerun()


def render_main():
    role = current_role()
    if role in ("safety_officer", "fleet_manager"):
        safety_dashboard_view.render()
    else:
        st.markdown(f"## Welcome, {st.session_state.profile['full_name']}")
        st.info(
            f"The **{ROLE_LABELS.get(role, role)}** workspace is being built by "
            "another team member. The Safety Officer dashboard is live — "
            "ask a Fleet Manager to switch your role if you need to preview it."
        )


def main():
    if not is_logged_in():
        login_view.render()
        return

    render_sidebar()
    render_main()


if __name__ == "__main__":
    main()
