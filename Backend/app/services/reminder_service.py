from datetime import timedelta,timedelta  
from app.utils.scheduler import scheduler
from app.utils.email_service import send_email

def schedule_task_reminder(task, task_id):
    """Schedule all reminders for a task"""
    if task["status"] == "done":
        return  # No reminders for completed tasks

    # 48-hour reminder
    remind_time_48h = task["due_date"] - timedelta(hours=48)
    if remind_time_48h > datetime.now():
        scheduler.add_job(
            func=send_reminder_email,
            trigger="date",
            run_date=remind_time_48h,
            args=[task, task_id, "48h"],
            id=f"reminder_48h_{task_id}",
            replace_existing=True
        )

    # 30-minute reminder
    remind_time_30m = task["due_date"] - timedelta(minutes=30)
    scheduler.add_job(
        func=send_reminder_email,
        trigger="date",
        run_date=remind_time_30m,
        args=[task, task_id, "30m"],
        id=f"reminder_30m_{task_id}",
        replace_existing=True
    )

    # Admin notification at deadline
    scheduler.add_job(
        func=send_admin_notification,
        trigger="date",
        run_date=task["due_date"],
        args=[task, task_id],
        id=f"admin_notification_{task_id}",
        replace_existing=True
    )

def send_reminder_email(task, task_id, reminder_type):
    """Send reminder email to task owner"""
    time_left = "48 hours" if reminder_type == "48h" else "30 minutes"
    subject = f"Task Reminder: '{task['title']}' due in {time_left}"
    body = f"""
    Reminder: Your task is due soon!
    
    Task: {task['title']}
    Due: {task['due_date'].strftime('%Y-%m-%d %H:%M')}
    Time left: {time_left}
    
    Description: {task.get('description', 'No description')}
    """
    send_email(task["user_id"], subject, body)

def send_admin_notification(task, task_id):
    """Send notification to admin when task is due"""
    subject = f"Task Due Now: {task['title']}"
    body = f"""
    Task Deadline Reached:
    
    Title: {task['title']}
    User ID: {task['user_id']}
    Due Date: {task['due_date'].strftime('%Y-%m-%d %H:%M')}
    Status: {task.get('status', 'pending')}
    
    Description: {task.get('description', 'No description')}
    """
    send_email("admin", subject, body)