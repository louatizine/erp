from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from datetime import datetime, timedelta
from bson import ObjectId
from .. import mail   # ✅ import mail from __init__.py
from ..utils.mongo import get_vehicle_collection
from ..utils.notifications import (
    get_upcoming_expirations,
    check_expiring_documents,
    send_expiration_notification
)

# Blueprint
vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')


@vehicles_bp.route('/test/email-smtp', methods=['GET'])
def test_email_smtp_direct():
    """Test email using direct SMTP connection (bypassing Flask-Mail)"""
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        smtp_server = current_app.config['MAIL_SERVER']
        smtp_port = current_app.config['MAIL_PORT']
        username = current_app.config['MAIL_USERNAME']
        password = current_app.config['MAIL_PASSWORD']
        recipient = current_app.config['ADMIN_EMAIL']

        print(f"🔧 Testing direct SMTP connection to {smtp_server}:{smtp_port}")
        print(f"   Username: {username}")
        print(f"   Password: {'*' * len(password) if password else 'NOT SET'}")

        msg = MIMEMultipart()
        msg['From'] = username
        msg['To'] = recipient
        msg['Subject'] = "Direct SMTP Test from Vehicle System"

        body = f"This is a direct SMTP test email sent at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(username, password)
            server.sendmail(username, recipient, msg.as_string())
            print("✅ Direct SMTP email sent successfully!")

        return jsonify({"message": "Direct SMTP test email sent successfully"}), 200

    except Exception as e:
        error_msg = f"❌ Direct SMTP test failed: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return jsonify({"error": error_msg}), 500


@vehicles_bp.route('', methods=['POST'])
@vehicles_bp.route('/', methods=['POST'])
def add_vehicle():
    vehicle_collection = get_vehicle_collection()
    data = request.json

    if not data.get('plate_number') or not data.get('owner_name'):
        return jsonify({"error": "Plate number and owner name are required"}), 400

    vehicle_doc = {
        "plate_number": data['plate_number'].upper(),
        "owner_name": data['owner_name'],
        "vehicle_type": data.get('vehicle_type', 'Private'),
        "documents": {
            "insurance": {
                "expiry_date": data.get('insurance_expiry', ''),
                "file": data.get('insurance_file', '')
            },
            "vignette": {
                "expiry_date": data.get('vignette_expiry', ''),
                "file": data.get('vignette_file', '')
            },
            "vesite": {
                "expiry_date": data.get('vesite_expiry', ''),
                "file": data.get('vesite_file', '')
            },
        },
        "visits": {
            "count": data.get('visits_count', 0),
            "last_visit": data.get('last_visit', '')
        },
        "notes": data.get('notes', ''),
        "created_at": datetime.utcnow()
    }

    try:
        if data.get('_id'):
            vehicle_collection.update_one(
                {"_id": ObjectId(data['_id'])},
                {"$set": vehicle_doc}
            )
            return jsonify({"message": "Vehicle updated successfully", "notification": True}), 200
        else:
            result = vehicle_collection.insert_one(vehicle_doc)
            return jsonify({"message": "Vehicle added successfully", "id": str(result.inserted_id), "notification": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/<vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    vehicle_collection = get_vehicle_collection()
    try:
        vehicle = vehicle_collection.find_one({"_id": ObjectId(vehicle_id)})
        if vehicle:
            vehicle['_id'] = str(vehicle['_id'])
            return jsonify(vehicle), 200
        return jsonify({"error": "Vehicle not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/<vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    data = request.json
    data['_id'] = vehicle_id
    return add_vehicle()


@vehicles_bp.route('/<vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    vehicle_collection = get_vehicle_collection()
    try:
        result = vehicle_collection.delete_one({"_id": ObjectId(vehicle_id)})
        if result.deleted_count > 0:
            return jsonify({"message": "Vehicle deleted successfully"}), 200
        return jsonify({"error": "Vehicle not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/<vehicle_id>/visit', methods=['POST'])
def record_visit(vehicle_id):
    vehicle_collection = get_vehicle_collection()
    try:
        current_time = datetime.utcnow()
        result = vehicle_collection.update_one(
            {"_id": ObjectId(vehicle_id)},
            {
                "$inc": {"visits.count": 1},
                "$set": {"visits.last_visit": current_time}
            }
        )
        if result.modified_count > 0:
            updated_vehicle = vehicle_collection.find_one({"_id": ObjectId(vehicle_id)})
            return jsonify({
                "message": "Visit recorded successfully",
                "visit_count": updated_vehicle['visits']['count'],
                "last_visit": current_time.isoformat()
            }), 200
        return jsonify({"error": "Vehicle not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/', methods=['GET'])
def list_vehicles():
    vehicle_collection = get_vehicle_collection()
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '').upper()
        skip = (page - 1) * per_page

        query = {}
        if search:
            query = {
                "$or": [
                    {"plate_number": {"$regex": search, "$options": "i"}},
                    {"owner_name": {"$regex": search, "$options": "i"}}
                ]
            }

        total = vehicle_collection.count_documents(query)
        vehicles = list(vehicle_collection.find(
            query,
            {
                'documents.insurance.file': 0,
                'documents.vignette.file': 0,
                'documents.vesite.file': 0
            }
        ).sort('created_at', -1).skip(skip).limit(per_page))

        for vehicle in vehicles:
            vehicle['_id'] = str(vehicle['_id'])
        return jsonify({
            'data': vehicles,
            'total': total,
            'page': page,
            'per_page': per_page
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/expirations/upcoming', methods=['GET'])
def get_upcoming_expirations_route():
    try:
        expirations = get_upcoming_expirations()
        return jsonify({
            'count': len(expirations),
            'expirations': expirations
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/expirations/test', methods=['GET'])
def test_expiration_notification():
    """Send a fake expiration email for testing"""
    try:
        test_expiration = [{
            'plate_number': 'TEST123',
            'owner_name': 'Test Owner',
            'document_type': 'Insurance',
            'expiry_date': (datetime.utcnow() + timedelta(days=5)).strftime('%Y-%m-%d'),
            'days_until_expiry': 5
        }]
        send_expiration_notification(test_expiration)
        return jsonify({"message": "Test notification sent successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/test/email', methods=['GET'])
def test_email_immediately():
    """Trigger expiration check immediately and send email if needed"""
    try:
        check_expiring_documents(current_app._get_current_object())
        return jsonify({"message": "Email check triggered manually"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/debug/dates', methods=['GET'])
def debug_dates():
    """Show stored document expiry dates"""
    try:
        vehicle_collection = get_vehicle_collection()
        vehicles = list(vehicle_collection.find({}))
        date_info = []
        for vehicle in vehicles:
            dates = {
                'plate_number': vehicle.get('plate_number'),
                'insurance': vehicle.get('documents', {}).get('insurance', {}).get('expiry_date'),
                'vignette': vehicle.get('documents', {}).get('vignette', {}).get('expiry_date'),
                'vesite': vehicle.get('documents', {}).get('vesite', {}).get('expiry_date')
            }
            date_info.append(dates)
        return jsonify(date_info), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/debug/current-date', methods=['GET'])
def debug_current_date():
    """Show server current date and warning date"""
    try:
        current_date = datetime.utcnow()
        warning_date = current_date + timedelta(days=10)
        return jsonify({
            "current_date_utc": current_date.strftime('%Y-%m-%d'),
            "warning_date_utc": warning_date.strftime('%Y-%m-%d'),
            "current_date_local": datetime.now().strftime('%Y-%m-%d'),
            "message": "The system checks for documents expiring between these dates"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@vehicles_bp.route('/test/email-config', methods=['GET'])
def test_email_config():
    """Send a test email using Flask-Mail"""
    try:
        print("🔧 Testing email configuration...")
        print(f"   MAIL_SERVER: {current_app.config['MAIL_SERVER']}")
        print(f"   MAIL_PORT: {current_app.config['MAIL_PORT']}")
        print(f"   MAIL_USE_TLS: {current_app.config['MAIL_USE_TLS']}")
        print(f"   MAIL_USERNAME: {current_app.config['MAIL_USERNAME']}")
        print(f"   ADMIN_EMAIL: {current_app.config['ADMIN_EMAIL']}")

        msg = Message(
            subject="🚗 Test Email from Vehicle System",
            recipients=[current_app.config['ADMIN_EMAIL']],
            body=f"This is a test email sent at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}."
        )

        mail.send(msg)
        print("✅ Test email sent successfully!")
        return jsonify({"message": "Test email sent successfully"}), 200
    except Exception as e:
        error_msg = f"❌ Email test failed: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return jsonify({"error": error_msg}), 500


@vehicles_bp.route('/expirations/notify', methods=['POST'])
def send_manual_notification():
    """Send notification for all upcoming expirations"""
    try:
        expirations = get_upcoming_expirations()
        if expirations:
            send_expiration_notification(expirations)
            return jsonify({
                "message": f"Notification sent for {len(expirations)} expiring documents",
                "count": len(expirations)
            }), 200
        else:
            return jsonify({"message": "No expiring documents found"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500