from datetime import datetime, timezone
from ..utils.mongo import get_license_collection, get_user_collection
from ..utils.mail import send_email

def get_admin_emails():
    user_collection = get_user_collection()
    admins = user_collection.find({"roles": "admin"})
    return [admin["email"] for admin in admins if admin.get("email")]

def notify_admins_about_expiring_licenses(app=None):
    """
    Vérifie les licences sur le point d'expirer (≤10 jours restants) et
    envoie des notifications par email à tous les administrateurs.
    Accepte un paramètre app optionnel pour une utilisation en dehors du contexte Flask.
    """
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
        Dynamix services
        """

        for email in admin_emails:
            # Passe le paramètre app s'il est fourni
            if app:
                send_email(email, subject, body, app)
            else:
                send_email(email, subject, body)
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
        Cher Administrateur,

        La licence "{lic.get('license_name', 'Inconnue')}" avec la clé {lic.get('license_key')}
        expirera le {expiry_date} (dans {lic.get('days_until_expiry')} jours).

        Veuillez prendre les mesures nécessaires.

        Cordialement,
        Dynamix Services
        """


        for email in admin_emails:
            # Pass the app parameter if provided
            if app:
                send_email(email, subject, body, app)
            else:
                send_email(email, subject, body)