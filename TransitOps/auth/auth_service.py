from database.supabase_client import supabase
from database.profile_queries import get_profile_by_id
from auth.session import login


def sign_in(email, password, selected_role, remember):

    try:

        response = supabase.auth.sign_in_with_password(
            {
                "email": email,
                "password": password
            }
        )

        user = response.user

        if not user:

            return False, "Invalid email or password."

        profile = get_profile_by_id(user.id)

        if not profile:

            return False, "Profile not found."

        if profile["role"] != selected_role:

            return False, "Role mismatch."

        login(profile, remember)

        return True, "Login Successful."

    except Exception as e:

        return False, str(e)
    