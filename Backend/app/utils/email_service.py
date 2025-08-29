from flask_mail import Message
from flask import current_app
from datetime import datetime

def send_leave_status_email(to_email, leave_request, status, rejection_reason=None):
    mail = current_app.extensions.get('mail')
    if not mail:
        current_app.logger.error("Mail extension not initialized")
        return False

    subject = f"Leave Request {status.capitalize()}"

    start_date = (
        leave_request['start_date'].strftime('%Y-%m-%d')
        if isinstance(leave_request['start_date'], datetime)
        else leave_request['start_date']
    )
    end_date = (
        leave_request['end_date'].strftime('%Y-%m-%d')
        if isinstance(leave_request['end_date'], datetime)
        else leave_request['end_date']
    )

    body = f"""
    Dear {leave_request.get('employee_name', 'Employee')},

    We would like to inform you that your recent leave request has been **{status.lower()}**.

    📌 Request Summary:
    - Leave Type: {leave_request['leave_type'].capitalize()}
    - Period: {start_date} to {end_date}
    - Total Days: {leave_request.get('leave_days', 'N/A')}
    - Status: {status.capitalize()}
    {f"- Rejection Reason: {rejection_reason}" if rejection_reason else ""}

    If you have any questions or need further assistance, please feel free to contact the HR department.

    Best regards,  
    HR Team
    """

    try:
        msg = Message(
            subject=subject,
            recipients=[to_email],
            body=body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER')  # Explicit sender here
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False
def send_email(user_id, subject, body):
    # Lookup user email in DB
    from app.utils.mongo import get_db
    db = get_db()
    user = db.users.find_one({"_id": user_id})
    if not user or "email" not in user:
        return
    email = user["email"]

    # TODO: Implement real email sending logic
    print(f"Sending email to {email}: {subject} - {body}")


