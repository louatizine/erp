from datetime import datetime, timezone
from ..utils.mongo import get_license_collection, get_user_collection
from ..utils.mail import send_email

def get_admin_emails():
    user_collection = get_user_collection()
    admins = user_collection.find({"roles": "admin"})
    return [admin["email"] for admin in admins if admin.get("email")]

def notify_admins_about_expiring_licenses(app=None):
    """
    Check for licenses that are about to expire (≤10 days left) and
    send email notifications to all admin users.
    Accepts optional app parameter for use outside Flask context.
    """
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