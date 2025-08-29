from flask import Blueprint, jsonify
from bson import ObjectId
from datetime import datetime, timedelta
from ..services.notification_service import NotificationService

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')
notification_service = NotificationService()

@notification_bp.route('/', methods=['GET'])
def get_notifications():
    try:
        days = int(request.args.get('days', 7))
        limit = int(request.args.get('limit', 50))
        notifications = notification_service.get_recent_notifications(days, limit)
        
        # Convert ObjectId and datetime
        for note in notifications:
            note['_id'] = str(note['_id'])
            note['created_at'] = note['created_at'].isoformat()
            
        return jsonify(notifications)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/<notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    try:
        result = notification_service.mark_as_read(notification_id)
        if result.modified_count > 0:
            return jsonify({"message": "Notification marked as read"})
        return jsonify({"error": "Notification not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notification_bp.route('/read-all', methods=['PUT'])
def mark_all_read():
    try:
        notification_service.mark_all_as_read()
        return jsonify({"message": "All notifications marked as read"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500