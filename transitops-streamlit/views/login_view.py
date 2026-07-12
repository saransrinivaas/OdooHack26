import streamlit as st

from auth.service import sign_in, sign_up, ROLE_LABELS


def render():
    st.markdown(
        "<h1 style='margin-bottom:0'>🚚 TransitOps</h1>"
        "<p style='color:#6c757d;margin-top:0'>Smart Transport Operations Platform</p>",
        unsafe_allow_html=True,
    )

    tab_login, tab_signup = st.tabs(["Log in", "Sign up"])

    with tab_login:
        with st.form("login_form"):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_password")
            submitted = st.form_submit_button("Log in", use_container_width=True)

        if submitted:
            if not email or not password:
                st.error("Enter both email and password.")
            else:
                with st.spinner("Logging in..."):
                    ok, message = sign_in(email, password)
                if ok:
                    st.success(message)
                    st.rerun()
                else:
                    st.error(message)

    with tab_signup:
        with st.form("signup_form"):
            full_name = st.text_input("Full name")
            su_email = st.text_input("Email", key="signup_email")
            su_password = st.text_input("Password", type="password", key="signup_password")
            su_password_confirm = st.text_input(
                "Confirm password", type="password", key="signup_password_confirm"
            )
            role = st.selectbox(
                "I am a",
                options=list(ROLE_LABELS.keys()),
                format_func=lambda r: ROLE_LABELS[r],
            )
            su_submitted = st.form_submit_button("Create account", use_container_width=True)

        if su_submitted:
            if not all([full_name, su_email, su_password]):
                st.error("Fill in all fields.")
            elif su_password != su_password_confirm:
                st.error("Passwords don't match.")
            elif len(su_password) < 6:
                st.error("Password must be at least 6 characters.")
            else:
                with st.spinner("Creating your account..."):
                    ok, message = sign_up(su_email, su_password, full_name, role)
                if ok:
                    st.success(message)
                    if "user" in st.session_state:
                        st.rerun()
                else:
                    st.error(message)
