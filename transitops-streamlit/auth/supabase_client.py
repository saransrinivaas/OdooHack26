import streamlit as st
from supabase import create_client, Client


def get_supabase_client() -> Client:
    """Returns a Supabase client scoped to THIS user's Streamlit session.

    Important: we deliberately do NOT use st.cache_resource here. A cached,
    process-wide client would share one auth session across every visitor
    hitting the same Streamlit server -- i.e. user A could end up making
    requests as user B. Each session gets its own client instead, stored in
    st.session_state.
    """
    if "sb_client" not in st.session_state:
        url = st.secrets["SUPABASE_URL"]
        key = st.secrets["SUPABASE_KEY"]
        st.session_state.sb_client = create_client(url, key)
    return st.session_state.sb_client

