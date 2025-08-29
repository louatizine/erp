from datetime import datetime, timedelta
from flask import current_app
from flask_mail import Message, Mail


def parse_date(date_str):
    """Parse date string from various formats."""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%m-%d-%Y'):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
    return None


def check_expiring_documents(app):
    with app.app_context():
        try:
            print("🔍 Starting expiration check...")
            from .mongo import get_vehicle_collection
            vehicle_collection = get_vehicle_collection()
            
            # Get current date (ignore the year, we care about relative dates)
            current_date = datetime.utcnow()
            warning_date = current_date + timedelta(days=10)
            
            print(f"📅 Today's date: {current_date.strftime('%Y-%m-%d')}")
            print(f"📅 Warning threshold: {warning_date.strftime('%Y-%m-%d')}")
            print("🔍 Looking for documents expiring within the next 10 days...")
            
            # Find all vehicles with documents
            all_vehicles = list(vehicle_collection.find({}))
            print(f"🚗 Found {len(all_vehicles)} vehicles total")
            
            expiring_vehicles = []
            
            for vehicle in all_vehicles:
                plate = vehicle.get('plate_number', 'N/A')
                print(f"🔎 Checking vehicle: {plate}")
                
                for doc_type in ['insurance', 'vignette', 'vesite']:
                    expiry_date_str = vehicle.get('documents', {}).get(doc_type, {}).get('expiry_date', '')
                    
                    if expiry_date_str:
                        expiry_date = parse_date(expiry_date_str)
                        
                        if expiry_date:
                            print(f"   📋 {doc_type}: {expiry_date.strftime('%Y-%m-%d')}")
                            
                            # Check if expiry date is within the next 10 days
                            if current_date <= expiry_date <= warning_date:
                                days_until_expiry = (expiry_date - current_date).days
                                print(f"   ⚠️  EXPIRING: {doc_type} in {days_until_expiry} days")
                                
                                expiring_vehicles.append({
                                    'plate_number': plate,
                                    'owner_name': vehicle.get('owner_name', 'N/A'),
                                    'document_type': doc_type.capitalize(),
                                    'expiry_date': expiry_date.strftime('%Y-%m-%d'),
                                    'days_until_expiry': days_until_expiry
                                })
                            else:
                                if expiry_date < current_date:
                                    print(f"   ✅ {doc_type}: Already expired on {expiry_date.strftime('%Y-%m-%d')}")
                                else:
                                    days_until = (expiry_date - current_date).days
                                    print(f"   ✅ {doc_type}: Expires in {days_until} days (not soon enough)")
                        else:
                            print(f"   ❌ {doc_type}: Could not parse date: {expiry_date_str}")
                    else:
                        print(f"   ❌ {doc_type}: No expiry date")
            
            # Send email if there are expiring documents
            if expiring_vehicles:
                print(f"📧 Found {len(expiring_vehicles)} expiring documents. Sending email...")
                send_expiration_notification(expiring_vehicles)
            else:
                print("✅ No expiring documents found within the next 10 days.")
                
        except Exception as e:
            current_app.logger.error(f"Error checking expiring documents: {str(e)}")
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()


def send_expiration_notification(expiring_vehicles):
    """Send email notification about expiring documents."""
    try:
        # Initialize Flask-Mail with current app
        mail = Mail(current_app._get_current_object())
        
        recipient = "zineeddinelouati02@gmail.com"
        subject = f"Vehicle Document Expiration Alert - {datetime.utcnow().strftime('%Y-%m-%d')}"

        html_body = """
        <html><body>
        <h2>🚨 Vehicle Document Expiration Alert</h2>
        <p>The following documents will expire soon:</p>
        <table border="1" cellpadding="8" cellspacing="0" width="100%">
            <tr>
                <th>Plate Number</th>
                <th>Owner Name</th>
                <th>Document Type</th>
                <th>Expiry Date</th>
                <th>Days Remaining</th>
            </tr>
        """
        for v in expiring_vehicles:
            row_class = "style='background-color:#f8d7da'" if v['days_until_expiry'] <= 3 else "style='background-color:#fff3cd'"
            html_body += f"""
                <tr {row_class}>
                    <td>{v['plate_number']}</td>
                    <td>{v['owner_name']}</td>
                    <td>{v['document_type']}</td>
                    <td>{v['expiry_date']}</td>
                    <td>{v['days_until_expiry']} days</td>
                </tr>
            """
        html_body += "</table></body></html>"

        msg = Message(subject=subject, recipients=[recipient], html=html_body)
        mail.send(msg)
        print(f"✅ Email sent successfully to {recipient}")

    except Exception as e:
        current_app.logger.error(f"❌ Email sending failed: {str(e)}")
        import traceback
        traceback.print_exc()


def get_upcoming_expirations():
    """Get all documents expiring in the next 10 days for API endpoint"""
    try:
        from .mongo import get_vehicle_collection
        vehicle_collection = get_vehicle_collection()
        current_date = datetime.utcnow()
        warning_date = current_date + timedelta(days=10)
        
        expiring_documents = []
        
        all_vehicles = list(vehicle_collection.find({}))
        for vehicle in all_vehicles:
            for doc_type in ['insurance', 'vignette', 'vesite']:
                expiry_date_str = vehicle.get('documents', {}).get(doc_type, {}).get('expiry_date', '')
                
                if expiry_date_str:
                    expiry_date = parse_date(expiry_date_str)
                    
                    if expiry_date and current_date <= expiry_date <= warning_date:
                        days_until_expiry = (expiry_date - current_date).days
                        
                        expiring_documents.append({
                            'vehicle_id': str(vehicle['_id']),
                            'plate_number': vehicle.get('plate_number', 'N/A'),
                            'owner_name': vehicle.get('owner_name', 'N/A'),
                            'document_type': doc_type.capitalize(),
                            'expiry_date': expiry_date.strftime('%Y-%m-%d'),
                            'days_until_expiry': days_until_expiry
                        })
        
        return expiring_documents
        
    except Exception as e:
        current_app.logger.error(f"Error getting upcoming expirations: {str(e)}")
        print(f"❌ Error getting expirations: {str(e)}")
        return []


def test_email():
    """Send a simple test email to verify config."""
    try:
        mail = Mail(current_app._get_current_object())
        msg = Message(
            subject="Test Email",
            recipients=[current_app.config['ADMIN_EMAIL']],
            body="✅ This is a test email from Flask-Mail"
        )
        mail.send(msg)
        print("✅ Test email sent!")
    except Exception as e:
        print(f"❌ Failed to send test email: {e}")
        import traceback
        traceback.print_exc()