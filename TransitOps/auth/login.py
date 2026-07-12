import streamlit as st

from config.roles import ROLES

from auth.auth_service import sign_in


def login_page():

    st.markdown("# 🚛 TransitOPS")

    st.caption("Smart Transport Operations Platform")

    st.divider()

    email = st.text_input("Email")

    password = st.text_input(
        "Password",
        type="password"
    )

    role = st.selectbox(
        "Role",
        ROLES
    )

    remember = st.checkbox(
        "Remember Me"
    )

    col1, col2 = st.columns(2)

    login_btn = col1.button(
        "Sign In",
        use_container_width=True
    )

    forgot_btn = col2.button(
        "Forgot Password",
        use_container_width=True
    )

    if login_btn:

        ok, msg = sign_in(
            email,
            password,
            role,
            remember
        )

        if ok:

            st.success(msg)

            st.rerun()

        else:

            st.error(msg)

    if forgot_btn:

        st.info(
            "Forgot Password module coming next."
        )
        