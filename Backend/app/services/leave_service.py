from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from bson import ObjectId
import os
from ..utils.mongo import get_employee_collection, get_leave_collection

LEAVE_PER_MONTH = 1.5  # Tunisia standard




def get_leave_balance(employee_id):
    """Calculate leave balance with proper date handling"""
    employees = get_employee_collection()
    leave_requests = get_leave_collection()
    
    try:
        employee_id_obj = ObjectId(employee_id)
    except:
        raise Exception("Invalid employee ID format")
    
    employee = employees.find_one({"_id": employee_id_obj})
    if not employee:
        raise Exception("Employee not found")
    
    # Use created_at if hire_date doesn't exist
    hire_date = employee.get('hire_date', employee.get('created_at', datetime.utcnow()))
    
    today = datetime.utcnow()
    delta = relativedelta(today, hire_date)
    months_worked = delta.years * 12 + delta.months
    
    # Adjust for partial month if needed
    if delta.days > 0:
        months_worked += 1
    
    # Get all approved paid leave days
    leave_taken = sum(
        (req['end_date'] - req['start_date']).days + 1
        for req in leave_requests.find({
            'employee_id': employee_id_obj,
            'status': 'approved',
            'leave_type': 'paid'
        })
    )
    
    accrued_leave = months_worked * LEAVE_PER_MONTH
    balance = accrued_leave - leave_taken
    
    return max(round(balance, 2), 0)

def submit_leave_request(employee_id, start_date, end_date, leave_type, reason=None, document_path=None):
    """Submit a new leave request with validation and admin notification"""
    from ..utils.admin_notifications import send_admin_leave_notification
    
    employees = get_employee_collection()
    leave_requests = get_leave_collection()
    
    try:
        employee_id_obj = ObjectId(employee_id)
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
        end_date = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError as e:
        raise Exception(f"Invalid format: {str(e)}")
    
    if end_date < start_date:
        raise Exception("End date cannot be before start date")
    
    leave_days = (end_date - start_date).days + 1
    
    # Check if employee exists
    if not employees.find_one({"_id": employee_id_obj}):
        raise Exception("Employee not found")
    
    # Check for overlapping leave requests
    existing_leave = leave_requests.find_one({
        "employee_id": employee_id_obj,
        "status": {"$in": ["pending", "approved"]},
        "$or": [
            {"start_date": {"$lte": end_date}, "end_date": {"$gte": start_date}},
        ]
    })
    
    if existing_leave:
        raise Exception("Existing leave request overlaps with this period")
    
    # Get employee information for the notification
    employee_info = employees.find_one({"_id": employee_id_obj})
    
    leave_request = {
        "employee_id": employee_id_obj,
        "start_date": start_date,
        "end_date": end_date,
        "leave_type": leave_type,
        "reason": reason,
        "document_path": document_path,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "leave_days": leave_days
    }
    
    result = leave_requests.insert_one(leave_request)
    leave_request['_id'] = str(result.inserted_id)
    leave_request['employee_id'] = employee_id  # Return string version
    
    # Send notification to admin
    try:
        send_admin_leave_notification(leave_request, employee_info)
    except Exception as e:
        # Log the error but don't prevent the leave request from being created
        print(f"Failed to send admin notification: {str(e)}")
    
    return leave_request

def approve_leave_request(request_id):
    leave_requests = get_leave_collection()
    employees = get_employee_collection()
    
    try:
        obj_id = ObjectId(request_id)
    except Exception:
        raise Exception("Invalid leave request ID")

    leave_request = leave_requests.find_one({"_id": obj_id})
    if not leave_request:
        raise Exception("Leave request not found")

    if leave_request['status'] != 'pending':
        raise Exception(f"Leave request already {leave_request['status']}")

    # Get employee email
    employee = employees.find_one({"_id": leave_request['employee_id']})
    if not employee:
        raise Exception("Employee not found")
    employee_email = employee.get('email')

    update_result = leave_requests.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "approved",
                "updated_at": datetime.utcnow(),
            }
        }
    )
    if update_result.modified_count == 0:
        raise Exception("Failed to approve leave request")

    # Return the updated leave request document
    updated_request = leave_requests.find_one({"_id": obj_id})

    # Send approval email
    if employee_email:
        try:
            send_leave_status_email(
                employee_email,
                updated_request,
                "approved"
            )
        except Exception as email_error:
            raise Exception(f"Approved but failed to send email: {str(email_error)}")

    return updated_request

def get_employee_leave_requests(employee_id):
    """Get all leave requests for an employee"""
    leave_requests = get_leave_collection()
    requests = list(leave_requests.find({"employee_id": ObjectId(employee_id)}).sort("created_at", -1))
    
    for req in requests:
        req['_id'] = str(req['_id'])
        req['employee_id'] = str(req['employee_id'])
    
    return requests

def cancel_leave_request(request_id):
    """Cancel a pending leave request"""
    leave_requests = get_leave_collection()
    
    result = leave_requests.update_one(
        {"_id": ObjectId(request_id), "status": "pending"},
        {"$set": {
            "status": "cancelled",
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count == 0:
        raise Exception("Leave request not found or cannot be cancelled")
    
    updated_request = leave_requests.find_one({"_id": ObjectId(request_id)})
    updated_request['_id'] = str(updated_request['_id'])
    return updated_request


#####

def send_leave_status_email(to_email, leave_request, status, rejection_reason=None):
    """Send email notification about leave request status change"""
    mail = current_app.extensions.get('mail')
    if not mail:
        current_app.logger.error("Mail extension not initialized")
        return False

    # Subject without showing the request ID
    subject = f"Leave Request Update: {status.capitalize()}"

    # Format dates
    start_date = leave_request['start_date'].strftime('%Y-%m-%d') if isinstance(leave_request['start_date'], datetime) else leave_request['start_date']
    end_date = leave_request['end_date'].strftime('%Y-%m-%d') if isinstance(leave_request['end_date'], datetime) else leave_request['end_date']

    # Enhanced email body
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
            body=body
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
        return False

#####


def cancel_leave_request(request_id):
    """Cancel a pending leave request"""
    leave_requests = get_leave_collection()
    
    result = leave_requests.update_one(
        {"_id": ObjectId(request_id), "status": "pending"},
        {"$set": {
            "status": "cancelled",
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.modified_count == 0:
        raise Exception("Leave request not found or cannot be cancelled")
    
    updated_request = leave_requests.find_one({"_id": ObjectId(request_id)})
    updated_request['_id'] = str(updated_request['_id'])
    return updated_request