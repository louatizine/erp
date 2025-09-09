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
    Vérifie les licences sur le point d'expirer (≤10 jours restants) et
    envoie des notifications par email à tous les administrateurs.
    Accepte un paramètre app optionnel pour une utilisation en dehors du contexte Flask.
    """
    # Import ici pour éviter les imports circulaires
    from ..utils.mail import send_email
    
    collection = get_license_collection()
    today = datetime.now(timezone.utc)

    # Licences expirant dans moins de 10 jours mais pas encore expirées
    expiring_licenses = list(collection.find({
        "status": "about_to_expire",
        "days_until_expiry": {"$lte": 10, "$gte": 0}
    }))

    if not expiring_licenses:
        print("Aucune licence sur le point d'expirer trouvée pour notification")
        return

    admin_emails = get_admin_emails()
    
    if not admin_emails:
        print("Aucun email administrateur trouvé pour notification")
        return

    for lic in expiring_licenses:
        subject = f"⚠️ Alerte d'Expiration de Licence: {lic.get('license_name', 'Inconnue')}"
        expiry_date = lic["expiry_date"]

        if isinstance(expiry_date, datetime):
            expiry_date = expiry_date.strftime("%d/%m/%Y")

        body = f"""
        Cher Administrateur,

        La licence "{lic.get('license_name', 'Inconnue')}" avec la clé {lic.get('license_key')} 
        expirera le {expiry_date} (dans {lic.get('days_until_expiry')} jours).

        Veuillez prendre les mesures nécessaires.

        Cordialement,
        Système de Gestion des Licences
        """

        for email in admin_emails:
            # Passe le paramètre app s'il est fourni
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