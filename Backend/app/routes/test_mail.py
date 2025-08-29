# routes/test_mail.py
from flask import Blueprint, current_app, jsonify
from ..utils.email_utils import send_email

test_mail_bp = Blueprint("test_mail", __name__, url_prefix="/api/test-mail")

@test_mail_bp.route("/", methods=["GET"])
def test_mail():
    recipient = current_app.config.get("ADMIN_EMAIL")
    success = send_email(
        to=recipient,
        subject="Test Email",
        body="If you see this, Flask-Mail works!"
    )
    return jsonify({"success": success})
