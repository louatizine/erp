from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
from ..utils.mongo import get_user_collection
from ..config import Config
from bson import ObjectId

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        required_fields = ['email', 'password', 'name', 'contract_type', 'contract_expiry']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        if len(data['password']) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        
        # Validate contract expiry date
        try:
            contract_expiry = datetime.fromisoformat(data['contract_expiry'].replace('Z', '+00:00'))
            if contract_expiry < datetime.utcnow():
                return jsonify({"error": "Contract expiry date must be in the future"}), 400
        except (ValueError, AttributeError):
            return jsonify({"error": "Invalid contract expiry date format"}), 400
        
        users = get_user_collection()
        if users.find_one({"email": data['email']}):
            return jsonify({"error": "Email already registered"}), 409
        
        user = {
            "name": data['name'],
            "email": data['email'],
            "password": generate_password_hash(data['password']),
            "contract_type": data['contract_type'],
            "contract_expiry": contract_expiry,
            "created_at": datetime.utcnow(),
            "roles": ["user"]  # default
        }
        
        result = users.insert_one(user)
        
        token = jwt.encode({
            'user_id': str(result.inserted_id),
            'exp': datetime.utcnow() + timedelta(days=7)
        }, Config.SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": str(result.inserted_id),
                "name": user['name'],
                "email": user['email'],
                "contract_type": user['contract_type'],
                "contract_expiry": user['contract_expiry'].isoformat(),
                "roles": user['roles']
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password required"}), 400
        
        users = get_user_collection()
        user = users.find_one({"email": data['email']})
        
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({"error": "Invalid credentials"}), 401
        
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.utcnow() + timedelta(days=7)
        }, Config.SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": str(user['_id']),
                "name": user['name'],
                "email": user['email'],
                "contract_type": user.get('contract_type', ''),
                "contract_expiry": user.get('contract_expiry', '').isoformat() if user.get('contract_expiry') else '',
                "roles": user.get('roles', [])
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500





@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    # If using Flask sessions
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


    
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password required"}), 400
        
        users = get_user_collection()
        user = users.find_one({"email": data['email']})
        
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({"error": "Invalid credentials"}), 401
            
        # Generate JWT token
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.utcnow() + timedelta(days=7)
        }, Config.SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": str(user['_id']),
                "name": user['name'],
                "email": user['email'],
                "roles": user.get('roles', [])
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500