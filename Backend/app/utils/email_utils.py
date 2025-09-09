from flask_mail import Message
from datetime import datetime, timedelta, timezone
from flask import current_app
from .mongo import get_todo_collection

def send_email(to, subject, body):
    """Send an email using Flask-Mail with error logging"""
    mail = current_app.extensions.get("mail")
    if not mail:
        current_app.logger.error("❌ Mail not initialized")
        return False

    try:
        msg = Message(subject=subject, recipients=[to], body=body)
        mail.send(msg)
        current_app.logger.info(f"📧 Email sent to {to} | subject: {subject}")
        return True
    except Exception as e:
        current_app.logger.error(f"❌ Failed to send email: {e}")
        return False

def check_due_tasks(app):
    """Vérifie les tâches bientôt dues ou en retard et envoie des notifications"""
    with app.app_context():
        now = datetime.now(timezone.utc)
        soon_24h = now + timedelta(hours=24)

        current_app.logger.info(f"🔍 Vérification des tâches : maintenant={now}, bientôt_24h={soon_24h}")

        # Requête pour les tâches bientôt dues ou en retard
        query = {
            "$or": [
                {"due_date": {"$lte": soon_24h, "$gte": now}, "status": "pending"},
                {"due_date": {"$lt": now}, "status": "pending"}
            ]
        }

        tasks = list(get_todo_collection().find(query))
        current_app.logger.info(f"📋 {len(tasks)} tâche(s) trouvée(s) bientôt dues ou en retard")

        for i, task in enumerate(tasks):
            due_date = task.get("due_date")

            # Convertir en UTC si datetime naïf
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)

            status = "EN RETARD" if due_date < now else "À ÉCHÉANCE BIENTÔT"
            current_app.logger.info(f"   Tâche {i+1}: '{task['title']}' - {status} - échéance {due_date}")

        # Envoi des emails
        for task in tasks:
            recipient = app.config.get("ADMIN_EMAIL", "admin@example.com")
            due_date = task.get("due_date")
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)

            if due_date < now:
                subject = f"URGENT : La tâche '{task['title']}' est EN RETARD !"
                time_status = f"devait être terminée le {due_date.strftime('%Y-%m-%d %H:%M')} (EN RETARD)"
            else:
                subject = f"Rappel : La tâche '{task['title']}' est bientôt à échéance"
                time_status = f"est à rendre le {due_date.strftime('%Y-%m-%d %H:%M')}"

            body = (
                f"Bonjour,\n\n"
                f"Votre tâche '{task['title']}' {time_status}.\n"
                f"Merci de la compléter dès que possible.\n\n"
                f"Cordialement"
            )

            current_app.logger.info(f"📨 Tentative d'envoi de notification pour : {task['title']}")
            success = send_email(recipient, subject, body)

            if success:
                current_app.logger.info(f"✅ Notification envoyée pour : {task['title']}")
            else:
                current_app.logger.error(f"❌ Échec d'envoi de la notification pour : {task['title']}")
