"""
roles.py
---------
Defines all application roles and role-related helper functions.
"""

# Role Constants
FLEET_MANAGER = "Fleet Manager"
DISPATCHER = "Dispatcher"
SAFETY_OFFICER = "Safety Officer"
FINANCIAL_ANALYST = "Financial Analyst"

# List of valid roles
ROLES = [
    FLEET_MANAGER,
    DISPATCHER,
    SAFETY_OFFICER,
    FINANCIAL_ANALYST,
]


def is_valid_role(role: str) -> bool:
    """
    Check whether the given role is valid.
    """
    return role in ROLES

