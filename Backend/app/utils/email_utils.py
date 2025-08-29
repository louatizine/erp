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
    """Check tasks due soon or overdue and send notifications"""
    with app.app_context():
        now = datetime.now(timezone.utc)
        soon_24h = now + timedelta(hours=24)

        current_app.logger.info(f"🔍 Checking due tasks: now={now}, soon_24h={soon_24h}")

        # Query for tasks due soon or overdue
        query = {
            "$or": [
                {"due_date": {"$lte": soon_24h, "$gte": now}, "status": "pending"},
                {"due_date": {"$lt": now}, "status": "pending"}
            ]
        }

        tasks = list(get_todo_collection().find(query))
        current_app.logger.info(f"📋 Found {len(tasks)} tasks due soon or overdue")

        for i, task in enumerate(tasks):
            due_date = task.get("due_date")

            # Convert naive datetime to UTC if necessary
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)

            status = "OVERDUE" if due_date < now else "DUE SOON"
            current_app.logger.info(f"   Task {i+1}: '{task['title']}' - {status} - due at {due_date}")

        # Send emails
        for task in tasks:
            recipient = app.config.get("ADMIN_EMAIL", "admin@example.com")
            due_date = task.get("due_date")
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)

            if due_date < now:
                subject = f"URGENT: Task '{task['title']}' is OVERDUE!"
                time_status = f"was due on {due_date.strftime('%Y-%m-%d %H:%M')} (OVERDUE)"
            else:
                subject = f"Reminder: Task '{task['title']}' is due soon"
                time_status = f"is due on {due_date.strftime('%Y-%m-%d %H:%M')}"

            body = (
                f"Hello,\n\n"
                f"Your task '{task['title']}' {time_status}.\n"
                f"Please complete it as soon as possible.\n\n"
                f"Best regards"
            )

            current_app.logger.info(f"📨 Attempting to send notification for: {task['title']}")
            success = send_email(recipient, subject, body)

            if success:
                current_app.logger.info(f"✅ Notification sent for: {task['title']}")
            else:
                current_app.logger.error(f"❌ Failed to send notification for: {task['title']}")
