from flask import Blueprint, request, current_app, jsonify
from werkzeug.utils import secure_filename
import os
from bson import ObjectId
from datetime import datetime
from ..services.leave_service import (
    get_leave_balance,
    submit_leave_request,
    get_employee_leave_requests,
    cancel_leave_request,
    get_leave_collection,
    get_employee_collection,
)

from ..utils.email_service import send_leave_status_email

leave_bp = Blueprint("leave", __name__, url_prefix="/api/leave")

def serialize_leave_request(request):
    """Helper to convert MongoDB document to JSON-serializable format"""
    serialized = {}
    for key, value in request.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized



@leave_bp.route("/balance/<employee_id>", methods=["GET"])
def get_balance(employee_id):
    try:
        balance = get_leave_balance(employee_id)
        return jsonify({
            "success": True,
            "data": {
                "employee_id": employee_id,
                "leave_balance": balance
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@leave_bp.route("/request", methods=["POST"])
def create_leave_request():
    try:
        data = request.form.to_dict()
        files = request.files
        
        required_fields = ['employee_id', 'start_date', 'end_date', 'leave_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Missing required field: {field}"
                }), 400
        
        document_path = None
        if 'document' in files:
            file = files['document']
            if file.filename == '':
                return jsonify({
                    "success": False,
                    "message": "No selected file"
                }), 400
            
            filename = secure_filename(file.filename)
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            document_path = os.path.join(upload_folder, filename)
            file.save(document_path)
        
        leave_request = submit_leave_request(
            employee_id=data['employee_id'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            leave_type=data['leave_type'],
            reason=data.get('reason', ''),
            document_path=document_path
        )
        
        return jsonify({
            "success": True,
            "message": "Leave request submitted successfully",
            "data": serialize_leave_request(leave_request)
        }), 201
        
    except Exception as e:
        if 'document_path' in locals() and document_path and os.path.exists(document_path):
            os.remove(document_path)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@leave_bp.route("/approve/<request_id>", methods=["POST"])
def approve_request(request_id):
    try:
        leave_requests = get_leave_collection()
        employees = get_employee_collection()
        
        try:
            request_obj_id = ObjectId(request_id)
        except:
            return jsonify({
                "success": False,
                "message": "Invalid leave request ID format"
            }), 400

        leave_request = leave_requests.find_one({"_id": request_obj_id})
        if not leave_request:
            return jsonify({
                "success": False,
                "message": "Leave request not found"
            }), 404

        if leave_request['status'] != 'pending':
            return jsonify({
                "success": False,
                "message": f"Leave request already {leave_request['status']}"
            }), 400

        # Get employee info
        employee = employees.find_one({"_id": leave_request['employee_id']})
        if not employee:
            return jsonify({
                "success": False,
                "message": "Employee not found"
            }), 404
            
        employee_email = employee.get('email')

        # Update leave request
        result = leave_requests.update_one(
            {"_id": request_obj_id},
            {"$set": {
                "status": "approved",
                "updated_at": datetime.utcnow(),
                "processed_by": ObjectId(request.headers.get('X-User-Id'))
            }}
        )
        
        if result.modified_count == 0:
            return jsonify({
                "success": False,
                "message": "No changes made to leave request"
            }), 400

        updated_request = leave_requests.find_one({"_id": request_obj_id})
        
        # Send approval email if email exists
        email_sent = False
        if employee_email:
            try:
                email_sent = send_leave_status_email(
                    employee_email,
                    updated_request,
                    "approved"
                )
            except Exception as email_error:
                current_app.logger.error(f"Email sending failed: {str(email_error)}")

        return jsonify({
            "success": True,
            "message": "Leave request approved successfully" + ("" if email_sent else " (but email failed to send)"),
            "data": serialize_leave_request(updated_request)
        })

    except Exception as e:
        current_app.logger.error(f"Error approving leave: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    try:
        leave_requests = get_leave_collection()
        
        try:
            request_obj_id = ObjectId(request_id)
        except:
            raise Exception("Invalid leave request ID format")

        leave_request = leave_requests.find_one({"_id": request_obj_id})
        if not leave_request:
            raise Exception("Leave request not found")

        if leave_request['status'] != 'pending':
            raise Exception(f"Leave request already {leave_request['status']}")

        result = leave_requests.update_one(
            {"_id": request_obj_id},
            {"$set": {
                "status": "approved",
                "updated_at": datetime.utcnow(),
                "processed_by": ObjectId(request.headers.get('X-User-Id'))
            }}
        )
        
        if result.modified_count == 0:
            raise Exception("No changes made to leave request")

        updated_request = leave_requests.find_one({"_id": request_obj_id})
        return jsonify({
            "success": True,
            "message": "Leave request approved successfully",
            "data": serialize_leave_request(updated_request)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@leave_bp.route("/employee/<employee_id>", methods=["GET"])
def get_employee_requests(employee_id):
    try:
        requests = get_employee_leave_requests(employee_id)
        serialized_requests = [serialize_leave_request(req) for req in requests]
        return jsonify({
            "success": True,
            "data": serialized_requests
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@leave_bp.route("/cancel/<request_id>", methods=["POST"])
def cancel_request(request_id):
    try:
        leave_request = cancel_leave_request(request_id)
        return jsonify({
            "success": True,
            "message": "Leave request cancelled successfully",
            "data": serialize_leave_request(leave_request)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@leave_bp.route("/all", methods=["GET"])
def get_all_leave_requests():
    try:
        leave_requests = list(get_leave_collection().find().sort("created_at", -1))
        serialized_requests = [serialize_leave_request(req) for req in leave_requests]
        
        return jsonify({
            "success": True,
            "data": serialized_requests
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching leave requests: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@leave_bp.route("/reject/<request_id>", methods=["POST"])
def reject_request(request_id):
    try:
        leave_requests = get_leave_collection()
        employees = get_employee_collection()
        
        try:
            request_obj_id = ObjectId(request_id)
        except:
            return jsonify({
                "success": False,
                "message": "Invalid leave request ID format"
            }), 400

        leave_request = leave_requests.find_one({"_id": request_obj_id})
        if not leave_request:
            return jsonify({
                "success": False,
                "message": "Leave request not found"
            }), 404

        if leave_request['status'] != 'pending':
            return jsonify({
                "success": False,
                "message": f"Leave request already {leave_request['status']}"
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        rejection_reason = data.get('rejection_reason', 'No reason provided')

        # Get employee info
        employee = employees.find_one({"_id": leave_request['employee_id']})
        if not employee:
            return jsonify({
                "success": False,
                "message": "Employee not found"
            }), 404
            
        employee_email = employee.get('email')

        # Update leave request
        result = leave_requests.update_one(
            {"_id": request_obj_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": rejection_reason,
                "updated_at": datetime.utcnow(),
                "processed_by": ObjectId(request.headers.get('X-User-Id'))
            }}
        )
        
        if result.modified_count == 0:
            return jsonify({
                "success": False,
                "message": "No changes made to leave request"
            }), 400

        updated_request = leave_requests.find_one({"_id": request_obj_id})
        
        # Send rejection email if email exists
        email_sent = False
        if employee_email:
            try:
                email_sent = send_leave_status_email(
                    employee_email,
                    updated_request,
                    "rejected",
                    rejection_reason
                )
            except Exception as email_error:
                current_app.logger.error(f"Email sending failed: {str(email_error)}")

        return jsonify({
            "success": True,
            "message": "Leave request rejected successfully" + ("" if email_sent else " (but email failed to send)"),
            "data": serialize_leave_request(updated_request)
        })

    except Exception as e:
        current_app.logger.error(f"Error rejecting leave: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    try:
        leave_requests = get_leave_collection()
        employees = get_employee_collection()
        
        try:
            request_obj_id = ObjectId(request_id)
        except:
            raise Exception("Invalid leave request ID format")

        leave_request = leave_requests.find_one({"_id": request_obj_id})
        if not leave_request:
            raise Exception("Leave request not found")

        if leave_request['status'] != 'pending':
            raise Exception(f"Leave request already {leave_request['status']}")

        data = request.get_json()
        rejection_reason = data.get('rejection_reason', 'No reason provided')

        result = leave_requests.update_one(
            {"_id": request_obj_id},
            {"$set": {
                "status": "rejected",
                "rejection_reason": rejection_reason,
                "updated_at": datetime.utcnow(),
                "processed_by": ObjectId(request.headers.get('X-User-Id'))
            }}
        )
        
        if result.modified_count == 0:
            raise Exception("No changes made to leave request")

        updated_request = leave_requests.find_one({"_id": request_obj_id})
        return jsonify({
            "success": True,
            "message": "Leave request rejected successfully",
            "data": serialize_leave_request(updated_request)
        })

    except Exception as e:
        current_app.logger.error(f"Error rejecting leave request: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400