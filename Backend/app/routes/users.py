from flask import Blueprint, jsonify
from bson import ObjectId
from flask import request
from datetime import datetime
from ..utils.mongo import get_user_collection, get_leave_collection

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

def calculate_leave_balance(user_id):
    users = get_user_collection()
    leaves = get_leave_collection()

    user = users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("created_at"):
        return None

    join_date = user["created_at"]
    now = datetime.utcnow()

    # Calcul du nombre de mois complets travaillés (arrondi à l'entier inférieur)
    total_days = (now - join_date).days
    months_worked = total_days // 30  # mois complets

    # Congés acquis : 2.5 jours par mois travaillé
    entitled_leave_days = months_worked * 2.5

    # Calcul des jours de congé déjà pris (statut "approved")
    pipeline = [
        {"$match": {
            "employee_id": ObjectId(user_id),
            "status": "approved"
        }},
        {"$project": {
            "duration": {
                "$add": [
                    {"$divide": [
                        {"$subtract": ["$end_date", "$start_date"]},
                        86400000  # ms dans une journée
                    ]},
                    1  # inclusif
                ]
            }
        }},
        {"$group": {
            "_id": None,
            "total_days": {"$sum": "$duration"}
        }}
    ]
    
    result = list(leaves.aggregate(pipeline))
    total_taken = result[0]["total_days"] if result else 0

    # Solde = congés acquis - congés pris
    balance = entitled_leave_days - total_taken
    return max(round(balance, 1), 0)  # pas négatif
#users list ##
@user_bp.route('/', methods=['GET'])
def list_users():
    users = get_user_collection()
    user_list = []
    
    for user in users.find():
        leave_balance = calculate_leave_balance(user["_id"])
        
        # Handle contract_expiry properly
        contract_expiry = user.get("contract_expiry")
        contract_expiry_iso = contract_expiry.isoformat() if contract_expiry else None
        
        user_list.append({
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "roles": user.get("roles", []),
            "join_date": user.get("created_at").isoformat() if user.get("created_at") else None,
            "leave_balance": leave_balance,
            "contract_type": user.get("contract_type", ""),
            "contract_expiry": contract_expiry_iso  # Fixed this line
        })
    
    return jsonify(user_list), 200
#update user #
@user_bp.route('/<user_id>', methods=['PATCH'])
def update_user(user_id):
    users = get_user_collection()
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    # List of all fields allowed to update
    allowed_fields = ['name', 'roles', 'email', 'contract_type', 'contract_expiry', 'created_at']

    update_fields = {}
    for field in allowed_fields:
        if field in data:
            # Convert dates from string to datetime if needed
            if field in ['contract_expiry', 'created_at'] and data[field]:
                try:
                    update_fields[field] = datetime.fromisoformat(data[field])
                except ValueError:
                    return jsonify({"error": f"Invalid date format for {field}"}), 400
            else:
                update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    result = users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    # Return updated user
    user = users.find_one({"_id": ObjectId(user_id)})
    leave_balance = calculate_leave_balance(user_id)
    contract_expiry = user.get("contract_expiry")
    user_data = {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "roles": user.get("roles", []),
        "join_date": user.get("created_at").isoformat() if user.get("created_at") else None,
        "leave_balance": leave_balance,
        "contract_type": user.get("contract_type", ""),
        "contract_expiry": contract_expiry.isoformat() if contract_expiry else None
    }

    return jsonify({"message": "User updated successfully", "user": user_data}), 200

    users = get_user_collection()
    data = request.get_json()

    update_fields = {}
    allowed_fields = ['name', 'roles', 'email', 'contract_type', 'contract_expiry']  # Added contract fields

    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "No valid fields to update"}), 400

    result = users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"message": "User updated successfully"}), 200