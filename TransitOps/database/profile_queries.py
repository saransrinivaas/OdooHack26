"""
profile_queries.py
------------------
Database queries related to user profiles.
"""

from database.supabase_client import supabase


def get_profile_by_email(email: str):
    """
    Fetch a user profile using email.

    Returns:
        dict | None
    """

    try:
        response = (
            supabase
            .table("profiles")
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )

        return response.data

    except Exception:
        return None


def get_profile_by_id(user_id: str):
    """
    Fetch a user profile using UUID.
    """

    try:
        response = (
            supabase
            .table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )

        return response.data

    except Exception:
        return None


def profile_exists(email: str) -> bool:
    """
    Check whether a profile exists.
    """

    return get_profile_by_email(email) is not None


def get_user_role(email: str):
    """
    Returns the user's role.
    """

    profile = get_profile_by_email(email)

    if profile:
        return profile.get("role")

    return None

