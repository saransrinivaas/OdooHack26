import streamlit as st

from auth.supabase_client import get_supabase_client

ROLE_LABELS = {
    "fleet_manager": "Fleet Manager",
    "driver": "Driver",
    "safety_officer": "Safety Officer",
    "financial_analyst": "Financial Analyst",
}


def sign_up(email: str, password: str, full_name: str, role: str):
    """Create the auth user, then the profile row, then (for drivers) a
    placeholder driver record. Returns (success: bool, message: str)."""
    sb = get_supabase_client()
    try:
        res = sb.auth.sign_up({"email": email, "password": password})
    except Exception as e:
        return False, f"Sign up failed: {e}"

    if not res.user:
        return False, "Sign up failed: no user returned."

    user_id = res.user.id

    # If email confirmation is enabled on the Supabase project, there is no
    # session yet -- profile/driver rows can't be inserted under RLS until
    # the user logs in for the first time after confirming their email.
    if res.session:
        sb.auth.set_session(res.session.access_token, res.session.refresh_token)
        try:
            sb.table("profiles").insert(
                {"id": user_id, "full_name": full_name, "role": role}
            ).execute()
            if role == "driver":
                sb.table("drivers").insert(
                    {
                        "user_id": user_id,
                        "name": full_name,
                        "license_number": f"PENDING-{user_id[:8]}",
                        "license_category": "lmv",
                        "license_expiry_date": "2000-01-01",
                        "status": "off_duty",
                    }
                ).execute()
        except Exception as e:
            return False, f"Account created, but profile setup failed: {e}"
        return True, "Account created! You're logged in."

    return True, (
        "Account created. Check your email to confirm your address, "
        "then log in — your profile will be finished on first login."
    )


def sign_in(email: str, password: str):
    sb = get_supabase_client()
    try:
        res = sb.auth.sign_in_with_password({"email": email, "password": password})
    except Exception as e:
        return False, f"Login failed: {e}"

    if not res.user or not res.session:
        return False, "Login failed: invalid credentials."

    sb.auth.set_session(res.session.access_token, res.session.refresh_token)
    st.session_state.user = res.user
    st.session_state.access_token = res.session.access_token

    profile = _get_or_bootstrap_profile(res.user.id, email)
    if profile is None:
        return False, (
            "Logged in, but no TransitOps role is set on this account yet. "
            "Contact a Fleet Manager to have your role assigned."
        )
    st.session_state.profile = profile
    return True, "Logged in."


def sign_out():
    sb = get_supabase_client()
    try:
        sb.auth.sign_out()
    except Exception:
        pass
    for key in ("user", "access_token", "profile", "sb_client"):
        st.session_state.pop(key, None)


def _get_or_bootstrap_profile(user_id: str, email: str):
    sb = get_supabase_client()
    result = sb.table("profiles").select("*").eq("id", user_id).execute()
    if result.data:
        return result.data[0]
    # No profile yet (e.g. they confirmed their email after signup and this
    # is their first real login) -- nothing we can safely default a role to,
    # so surface that clearly rather than guessing.
    return None


def current_role() -> str | None:
    profile = st.session_state.get("profile")
    return profile["role"] if profile else None


def is_logged_in() -> bool:
    return "user" in st.session_state and "profile" in st.session_state
