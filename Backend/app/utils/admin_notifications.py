from flask import current_app
from flask_mail import Message, Mail
from datetime import datetime

def send_admin_leave_notification(leave_request, employee_info):
    """Send email notification to admin about new leave request"""
    mail = current_app.extensions.get('mail')
    if not mail:
        current_app.logger.error("Mail extension not initialized")
        return False

    admin_email = current_app.config.get('ADMIN_EMAIL')  # Get admin email from config
    if not admin_email:
        current_app.logger.error("Admin email not configured")
        return False

    # Format dates
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

    # Create email subject and body
    subject = f"New Leave Request from {employee_info.get('name', 'Employee')}"

    body = f"""
    Dear Admin,

    A new leave request has been submitted and requires your attention.

    👤 Employee Details:
    - Name: {employee_info.get('name', 'N/A')}
    - Email: {employee_info.get('email', 'N/A')}
    - Department: {employee_info.get('department', 'N/A')}

    📅 Leave Request Details:
    - Leave Type: {leave_request['leave_type'].capitalize()}
    - Start Date: {start_date}
    - End Date: {end_date}
    - Total Days: {leave_request.get('leave_days', 'N/A')}
    - Reason: {leave_request.get('reason', 'No reason provided')}

    Please review this request at your earliest convenience.

    Best regards,
    HR System
    """

    try:
        msg = Message(
            subject=subject,
            recipients=[admin_email],
            body=body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER')
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send admin notification: {str(e)}")
        return False
