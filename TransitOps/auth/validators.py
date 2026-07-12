import re


def valid_email(email):

    pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

    return re.match(pattern, email)


def valid_password(password):

    return len(password) >= 6