from flask import Flask
from flask_cors import CORS
from .config import Config
from .utils.mongo import init_mongo
from flask_mail import Mail
import os
from apscheduler.schedulers.background import BackgroundScheduler
import atexit

mail = Mail()
scheduler = None
scheduler_started = False

def create_app():
    global scheduler, scheduler_started
    
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Content-Disposition"]  
        }
    })
    
    # Email Configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() in ['true', '1', 't']
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
    app.config['ADMIN_EMAIL'] = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    
    # Initialize extensions
    mail.init_app(app)
    init_mongo(app)
    
    # Register blueprints
    from .routes.invoice_routes import invoice_bp
    from .routes.vehicle_routes import vehicles_bp
    from .routes.auth_routes import auth_bp
    from .routes.leave_routes import leave_bp
    from .routes.users import user_bp
    from .routes.license_routes import license_bp
    from .routes.archiving import archive_bp
    from .routes.todo_routes import todo_bp
    from .routes.test_mail import test_mail_bp

    app.register_blueprint(invoice_bp)
    app.register_blueprint(vehicles_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(leave_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(license_bp)
    app.register_blueprint(archive_bp)
    app.register_blueprint(todo_bp)
    app.register_blueprint(test_mail_bp)
    
    # Start scheduler only once
    if not scheduler_started:
        start_scheduler(app)
        scheduler_started = True
    
    return app

def start_scheduler(app):
    """Start the scheduler with all jobs"""
    global scheduler
    
    scheduler = BackgroundScheduler()
    
    # Vehicle document expiration notifications
    scheduler.add_job(
        func=lambda: check_expiring_documents_with_context(app),
        trigger='cron',
        hour=11,
        minute=37,
        id="vehicle_docs_check"
    )

    # License expiry notifications
    scheduler.add_job(
        func=lambda: notify_admins_about_expiring_licenses_with_context(app),
        trigger='cron',
        hour=11,
        minute=37,
        id="license_check"
    )

    # Todo tasks expiry notifications (daily at 10:21 for testing)
    scheduler.add_job(
        func=lambda: notify_due_tasks_with_context(app),
        trigger='cron',
        hour=11,
        minute=37,
        id="todo_due_check"
    )

    scheduler.start()
    print("✅ Scheduler started for vehicle, license, and todo notifications")
    
    # Shut down scheduler when app exits
    atexit.register(lambda: scheduler.shutdown())

# -------------------------------
# Helper functions with app context
# -------------------------------
def check_expiring_documents_with_context(app):
    from .utils.notifications import check_expiring_documents
    with app.app_context():
        check_expiring_documents(app)

def notify_admins_about_expiring_licenses_with_context(app):
    from .services.license_notifications import notify_admins_about_expiring_licenses
    with app.app_context():
        notify_admins_about_expiring_licenses(app)

def notify_due_tasks_with_context(app):
    from .utils.email_utils import check_due_tasks
    with app.app_context():
        check_due_tasks(app)
