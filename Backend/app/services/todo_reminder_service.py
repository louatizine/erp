from datetime import datetime, timedelta
from app.utils.mongo import get_db
from app.utils.email_utils import send_email_to_user_by_id
import pytz

UTC = pytz.utc

def check_and_send_due_soon_notifications(app=None):
    """
    Find tasks that are due ~24 hours from now (window) and send reminder to owner.
    Use a window around 24 hours so scheduler run time variances are tolerated.
    """
    db = get_db()
    now = datetime.now(UTC)
    lower = now + timedelta(hours=23)   # 23h
    upper = now + timedelta(hours=25)   # 25h

    # pending tasks whose due_date falls inside the window
    query = {"status": "pending", "due_date": {"$gte": lower, "$lte": upper}}
    tasks = list(db.todos.find(query))

    for task in tasks:
        try:
            user_id = task.get("user_id")
            subject = f"⏰ Reminder: Task '{task.get('title')}' due in ~24 hours"
            due_str = task["due_date"].astimezone(UTC).strftime("%Y-%m-%d %H:%M UTC")
            body = f"Hello,\n\nYour task '{task.get('title')}' is due on {due_str}.\n\nDescription: {task.get('description','No description')}\n\nPlease complete it on time.\n\nRegards,\nTask System"
            send_email_to_user_by_id(user_id, subject, body, app)
            print(f"Reminder sent for task {task.get('_id')} to user {user_id}")
        except Exception as e:
            print(f"Failed to send reminder for task {task.get('_id')}: {e}")


def check_and_send_overdue_notifications(app=None):
    """
    Notify users of overdue tasks (due_date < now and still pending).
    """
    db = get_db()
    now = datetime.now(UTC)
    query = {"status": "pending", "due_date": {"$lt": now}}
    tasks = list(db.todos.find(query))

    for task in tasks:
        try:
            user_id = task.get("user_id")
            subject = f"⚠️ Overdue: Task '{task.get('title')}'"
            due_str = task["due_date"].astimezone(UTC).strftime("%Y-%m-%d %H:%M UTC")
            body = f"Hello,\n\nYour task '{task.get('title')}' was due on {due_str} and is now overdue.\n\nDescription: {task.get('description','No description')}\n\nPlease update the status or follow up.\n\nRegards,\nTask System"
            send_email_to_user_by_id(user_id, subject, body, app)
            print(f"Overdue notification sent for task {task.get('_id')} to user {user_id}")
        except Exception as e:
            print(f"Failed to send overdue notification for task {task.get('_id')}: {e}")
