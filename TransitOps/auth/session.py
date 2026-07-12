import streamlit as st

def initialize_session():
    defaults = {
        "logged_in": False,
        "user": None,
        "remember_me": False,
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def login(user_data, remember=False):
    st.session_state.logged_in = True
    st.session_state.user = user_data
    st.session_state.remember_me = remember


def logout():
    st.session_state.logged_in = False
    st.session_state.user = None
    st.session_state.remember_me = False


def is_logged_in():
    return st.session_state.logged_in


def current_user():
    return st.session_state.user


def current_role():
    if st.session_state.user:
        return st.session_state.user["role"]

    return None
