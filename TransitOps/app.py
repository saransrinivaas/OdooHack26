import streamlit as st

from config.settings import *

from auth.session import *

from auth.login import login_page

st.set_page_config(
    page_title=APP_NAME,
    page_icon=PAGE_ICON,
    layout=LAYOUT
)

initialize_session()

if not is_logged_in():

    login_page()

else:

    role = current_role()

    st.success(f"Welcome {current_user()['full_name']}")

    st.write(f"Role : {role}")

    st.write("Dashboard coming next...")