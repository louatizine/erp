from flask import Blueprint, jsonify, request
from datetime import datetime, timezone
from bson import ObjectId
from ..utils.mongo import get_license_collection
from ..services.licence_service import calculate_license_status
import logging

license_bp = Blueprint("licenses", __name__, url_prefix="/api/licenses")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@license_bp.route("/alerts", methods=["GET"])
def get_expiring_licenses():
    try:
        collection = get_license_collection()
        
        # Get licenses expiring within 30 days
        alerts = list(collection.find({
            "$or": [
                {"status": "about_to_expire"},
                {"status": "expired"}
            ]
        }).sort("expiry_date", 1))
        
        # Convert ObjectId and format dates
        for lic in alerts:
            lic["_id"] = str(lic["_id"])
            if isinstance(lic["expiry_date"], datetime):
                lic["expiry_date"] = lic["expiry_date"].isoformat()
            elif isinstance(lic["expiry_date"], str):
                try:
                    # Ensure the string is properly formatted
                    dt = datetime.fromisoformat(lic["expiry_date"])
                    lic["expiry_date"] = dt.isoformat()
                except ValueError:
                    lic["expiry_date"] = "Invalid date format"
        
        return jsonify(alerts)
    
    except Exception as e:
        logger.error(f"Error fetching expiring licenses: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@license_bp.route("/", methods=["POST"])
def create_license():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validation - updated required fields
        required_fields = ["license_name", "license_key", "expiry_date"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"{field} is required"}), 400
        
        # Parse dates and ensure timezone awareness
        today = datetime.now(timezone.utc)
        
        # Handle expiry date
        expiry_date = None
        if isinstance(data["expiry_date"], str):
            try:
                expiry_date = datetime.fromisoformat(data["expiry_date"]).replace(tzinfo=timezone.utc)
            except ValueError:
                return jsonify({"error": "Invalid expiry date format"}), 400
        
        # Handle purchase date if provided
        purchase_date = None
        if data.get("purchase_date"):
            try:
                purchase_date = datetime.fromisoformat(data["purchase_date"]).replace(tzinfo=timezone.utc)
            except ValueError:
                return jsonify({"error": "Invalid purchase date format"}), 400
        
        # Calculate status
        status, days_left = calculate_license_status(expiry_date)
        
        # Prepare document - removed vehicle_id, added license_name
        new_license = {
            "license_name": data["license_name"],
            "license_key": data["license_key"],
            "purchase_date": purchase_date,
            "expiry_date": expiry_date,
            "status": status,
            "days_until_expiry": days_left,
            "created_at": today,
            "last_updated": today
        }
        
        # Remove None values
        new_license = {k: v for k, v in new_license.items() if v is not None}
        
        result = get_license_collection().insert_one(new_license)
        return jsonify({
            "message": "License created successfully",
            "id": str(result.inserted_id),
            "status": status,
            "days_until_expiry": days_left
        }), 201
        
    except ValueError as ve:
        logger.error(f"Validation error: {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.error(f"Error creating license: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500




#####

@license_bp.route("/", methods=["GET"])
def get_all_licenses():
    try:
        collection = get_license_collection()
        all_licenses = list(collection.find().sort("expiry_date", 1))
        
        # Convert ObjectId and format dates + update status
        for lic in all_licenses:
            lic["_id"] = str(lic["_id"])
            
            # Recalculate status for each license
            if isinstance(lic["expiry_date"], datetime):
                expiry_date = lic["expiry_date"]
                if expiry_date.tzinfo is None:
                    expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
                # Calculate current status
                status, days_left = calculate_license_status(expiry_date)
                
                # Update the license status if it has changed
                if lic.get("status") != status:
                    collection.update_one(
                        {"_id": lic["_id"]},
                        {"$set": {
                            "status": status,
                            "days_until_expiry": days_left,
                            "last_updated": datetime.now(timezone.utc)
                        }}
                    )
                    lic["status"] = status
                    lic["days_until_expiry"] = days_left
            
            # Format date for response
            if isinstance(lic["expiry_date"], datetime):
                lic["expiry_date"] = lic["expiry_date"].isoformat()
        
        return jsonify(all_licenses)
    except Exception as e:
        logger.error(f"Error fetching all licenses: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

###






@license_bp.route("/expiring", methods=["GET"])
def get_expiring_count():
    try:
        collection = get_license_collection()
        
        counts = {
            "expired": collection.count_documents({"status": "expired"}),
            "about_to_expire": collection.count_documents({"status": "about_to_expire"}),
            "active": collection.count_documents({"status": "active"})
        }
        
        return jsonify(counts)
    
    except Exception as e:
        logger.error(f"Error getting license counts: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

""" @license_bp.after_request
def after_request(response):
    # Add CORS headers to every response
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response """