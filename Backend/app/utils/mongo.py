from pymongo import MongoClient
from flask import current_app

client = None
db = None

def init_mongo(app):
    global client, db
    uri = app.config.get("MONGO_URI")
    client = MongoClient(uri)
    db = client[app.config.get("MONGO_DBNAME", "invoice_db")]
    app.mongo_client = client

def get_db():
    if db is None:
        raise RuntimeError("MongoDB not initialized")
    return db

def get_invoice_collection():
    return get_db()["invoices"]

def get_vehicle_collection():
    return get_db()["vehicle_documents"]

def get_user_collection():
    return get_db()["users"]

def get_leave_collection():
    return get_db()["leave_requests"]

def get_employee_collection():
    return get_db()["users"]

def get_license_collection():
    return get_db()["licenses"]

def get_archive_collection():
    return get_db()["archived_documents"]

def get_todo_collection():
    return get_db()["todos"]



# -------------------------------
# Helper to fetch admin users
# -------------------------------
def get_admin_users():
    """
    Returns a list of users with role 'admin' and an email.
    """
    db = get_db()
    admins = db.users.find({"role": "admin", "email": {"$exists": True}})
    return [admin for admin in admins if admin.get("email")]