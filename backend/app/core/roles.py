from enum import Enum

class UserRole(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    BRANCH_MANAGER = "BRANCH_MANAGER"
    KITCHEN_MANAGER = "KITCHEN_MANAGER"
    KITCHEN_STAFF = "KITCHEN_STAFF"
    CASHIER = "CASHIER"
    RIDER = "RIDER"
    CUSTOMER = "CUSTOMER"

# Role hierarchy or specific capabilities helper
ROLE_PERMISSIONS = {
    UserRole.OWNER: [
        "all_branches", "financial_reports", "manage_staff", "manage_branches",
        "manage_menu", "manage_deals", "manage_inventory", "manage_orders",
        "feedback_analysis", "system_settings"
    ],
    UserRole.ADMIN: [
        "manage_branches", "manage_users", "manage_menu", "manage_orders",
        "manage_deals", "manage_tables", "manage_qr", "view_reports"
    ],
    UserRole.BRANCH_MANAGER: [
        "assigned_branch_only", "branch_orders", "branch_staff", "branch_inventory",
        "branch_sales", "branch_tables", "kitchen_ops"
    ],
    UserRole.KITCHEN_MANAGER: [
        "assigned_branch_only", "view_kitchen", "update_kitchen_order", "manage_prep_time"
    ],
    UserRole.KITCHEN_STAFF: [
        "assigned_branch_only", "view_kitchen", "update_kitchen_order"
    ],
    UserRole.CASHIER: [
        "assigned_branch_only", "create_order", "manage_order", "bills", "payments", "tables"
    ],
    UserRole.RIDER: [
        "view_assigned_deliveries", "accept_delivery", "update_delivery_status"
    ],
    UserRole.CUSTOMER: [
        "browse_menu", "place_order", "track_order", "view_bill", "pay", "feedback"
    ]
}
