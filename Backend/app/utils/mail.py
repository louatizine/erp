from flask_mail import Message
from flask import current_app
from threading import Thread
from app import mail
import smtplib

# -------------------------------
# Async email sender
# -------------------------------
def send_async_email(app, msg):
    """
    Send an email asynchronously within Flask app context.
    """
    with app.app_context():
        try:
            print(f"📧 Sending email to: {msg.recipients}")
            mail.send(msg)
            print(f"✅ Email sent successfully to {msg.recipients}")
        except smtplib.SMTPAuthenticationError as e:
            print(f"❌ SMTP Authentication failed: {e}")
            print("Check your email credentials or password")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            import traceback
            print(traceback.format_exc())

# -------------------------------
# Send email to a single recipient
# -------------------------------
def send_email(recipient, subject, body, app=None):
    """
    Send email directly to a given recipient.
    """
    if app is None:
        try:
            app = current_app._get_current_object()
        except RuntimeError:
            raise RuntimeError("No Flask app context found. Please provide 'app' parameter.")
    
    msg = Message(
        subject,
        recipients=[recipient],
        body=body,
        sender=app.config['MAIL_DEFAULT_SENDER']
    )
    Thread(target=send_async_email, args=(app, msg)).start()


# -------------------------------
# Send email to a specific user by user_id
# -------------------------------
def send_email_to_user(user_id, subject, body, app=None):
    """
    Look up a user by user_id and send them an email.
    """
    from app.utils.mongo import get_db

    if app is None:
        app = current_app._get_current_object()
    
    db = get_db()
    user = db.users.find_one({"_id": user_id})
    if not user or "email" not in user:
        print(f"⚠️ No email found for user {user_id}")
        return
    
    email = user["email"]
    msg = Message(subject, recipients=[email], body=body, sender=app.config['MAIL_DEFAULT_SENDER'])
    Thread(target=send_async_email, args=(app, msg)).start()


# -------------------------------
# Send email to all admin users
# -------------------------------
def send_email_to_admins(subject, body, app=None):
    """
    Sends an email to all users with role 'admin'.
    """
    from app.utils.mongo import get_admin_users

    if app is None:
        app = current_app._get_current_object()
    
    admins = get_admin_users()
    if not admins:
        print("⚠️ No admin users found to send email")
        return
    
    for admin in admins:
        if "email" in admin:
            recipient = admin["email"]
            msg = Message(subject, recipients=[recipient], body=body, sender=app.config['MAIL_DEFAULT_SENDER'])
            Thread(target=send_async_email, args=(app, msg)).start()
            print(f"✅ Email scheduled for admin: {recipient}")
