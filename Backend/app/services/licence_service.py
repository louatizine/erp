from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from ..utils.mongo import get_license_collection, get_user_collection

# Core license functions
def calculate_license_status(expiry_date):
    """Calculate license status with timezone-aware datetimes"""
    # Ensure expiry_date is timezone-aware
    if isinstance(expiry_date, datetime) and expiry_date.tzinfo is None:
        expiry_date = expiry_date.replace(tzinfo=timezone.utc)
    
    # Get current time in UTC
    today = datetime.now(timezone.utc)
    
    # Calculate difference
    delta = expiry_date - today
    days_left = delta.days
    
    status = "active"
    if days_left < 0:
        status = "expired"
    elif days_left <= 7:
        status = "about_to_expire"
    
    return status, days_left

def update_license_status():
    collection = get_license_collection()
    today = datetime.now().date()
    
    for license in collection.find():
        expiry_date = datetime.strptime(license["expiry_date"], "%Y-%m-%d")
        status, days_left = calculate_license_status(expiry_date)
        
        update_data = {
            "status": status,
            "days_until_expiry": days_left,
            "last_updated": datetime.utcnow()
        }
        
        collection.update_one(
            {"_id": license["_id"]},
            {"$set": update_data}
        )

def get_admin_emails():
    user_collection = get_user_collection()
    admins = user_collection.find({"roles": "admin"})
    return [admin["email"] for admin in admins if admin.get("email")]

# Scheduler functions (import mail only when needed to avoid circular imports)
def notify_admins_about_expiring_licenses(app=None):
    """
    Check for licenses that are about to expire (≤10 days left) and
    send email notifications to all admin users.
    Accepts optional app parameter for use outside Flask context.
    """
    # Import here to avoid circular imports
    from ..utils.mail import send_email
    
    collection = get_license_collection()
    today = datetime.now(timezone.utc)

    # Licenses expiring within 10 days but not expired
    expiring_licenses = list(collection.find({
        "status": "about_to_expire",
        "days_until_expiry": {"$lte": 10, "$gte": 0}
    }))

    if not expiring_licenses:
        print("No expiring licenses found for notification")
        return

    admin_emails = get_admin_emails()
    
    if not admin_emails:
        print("No admin emails found for notification")
        return

    for lic in expiring_licenses:
        subject = f"⚠️ License Expiry Alert: {lic.get('license_name', 'Unknown')}"
        expiry_date = lic["expiry_date"]

        if isinstance(expiry_date, datetime):
            expiry_date = expiry_date.strftime("%Y-%m-%d")

        body = f"""
        Dear Admin,

        The license "{lic.get('license_name', 'Unknown')}" with key {lic.get('license_key')} 
        will expire on {expiry_date} (in {lic.get('days_until_expiry')} days).

        Please take necessary action.

        Regards,
        License Management System
        """

        for email in admin_emails:
            # Pass the app parameter if provided
            if app:
                send_email(email, subject, body, app)
            else:
                send_email(email, subject, body)

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_license_status, "interval", hours=24)
    scheduler.start()

# Initialize scheduler when module is imported
start_scheduler()