from datetime import datetime
from ..utils.mongo import get_db
from bson import ObjectId

class NotificationService:
    def __init__(self):
        self.db = get_db()
        self.notifications = self.db.notifications
        
    def create_notification(self, notification_type, entity_type, entity_id, message, metadata=None):
        """Create a new notification"""
        notification = {
            "type": notification_type,  # 'update', 'expiry', 'creation', 'deletion'
            "entity_type": entity_type,  # 'license' or 'vehicle'
            "entity_id": entity_id,
            "message": message,
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
            "read": False
        }
        return self.notifications.insert_one(notification).inserted_id
    
    def get_unread_notifications(self, limit=10):
        """Get unread notifications"""
        return list(self.notifications.find({"read": False}).sort("created_at", -1).limit(limit))
    
    def mark_as_read(self, notification_id):
        """Mark notification as read"""
        return self.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True}}
        )
    
    def get_recent_notifications(self, days=7, limit=50):
        """Get recent notifications"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return list(self.notifications.find({
            "created_at": {"$gte": cutoff_date}
        }).sort("created_at", -1).limit(limit))