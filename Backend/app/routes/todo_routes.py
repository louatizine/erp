from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime, timezone
from ..utils.mongo import get_todo_collection

todo_bp = Blueprint("todo", __name__, url_prefix="/api/todos")

def serialize_task(task):
    return {
        "_id": str(task["_id"]),
        "title": task.get("title", ""),
        "description": task.get("description", ""),
        "due_date": task.get("due_date").strftime("%Y-%m-%d %H:%M") if task.get("due_date") else None,
        "status": task.get("status", "pending"),
        "created_at": task.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if task.get("created_at") else None
    }

# -------------------------------
# CREATE
# -------------------------------
@todo_bp.route("/", methods=["POST"])
def create_task():
    try:
        data = request.json
        if not data.get("title") or not data.get("due_date"):
            return jsonify({"error": "Title and due_date are required"}), 400

        due_str = data["due_date"]
        # Handle date only or datetime with/without seconds
        try:
            if "T" in due_str:
                try:
                    due_date = datetime.strptime(due_str, "%Y-%m-%dT%H:%M:%S")
                except ValueError:
                    due_date = datetime.strptime(due_str, "%Y-%m-%dT%H:%M")
            else:
                due_date = datetime.strptime(due_str, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid due_date format"}), 400

        task = {
            "title": data["title"],
            "description": data.get("description", ""),
            "due_date": due_date.replace(tzinfo=timezone.utc),
            "status": data.get("status", "pending"),
            "created_at": datetime.now(timezone.utc)
        }

        result = get_todo_collection().insert_one(task)
        task["_id"] = result.inserted_id
        return jsonify(serialize_task(task)), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------
# UPDATE
# -------------------------------
@todo_bp.route("/<task_id>", methods=["PUT"])
def update_task(task_id):
    try:
        data = request.json
        updates = {}

        if "title" in data:
            updates["title"] = data["title"]
        if "description" in data:
            updates["description"] = data["description"]
        if "status" in data:
            updates["status"] = data["status"]
        if "due_date" in data:
            due_str = data["due_date"]
            if "T" in due_str:
                try:
                    updates["due_date"] = datetime.strptime(due_str, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
                except ValueError:
                    updates["due_date"] = datetime.strptime(due_str, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
            else:
                updates["due_date"] = datetime.strptime(due_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)

        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400

        result = get_todo_collection().update_one(
            {"_id": ObjectId(task_id)},
            {"$set": updates}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Task not found"}), 404

        updated_task = get_todo_collection().find_one({"_id": ObjectId(task_id)})
        return jsonify(serialize_task(updated_task)), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------
# READ
# -------------------------------
@todo_bp.route("/", methods=["GET"])
def get_tasks():
    try:
        tasks = list(get_todo_collection().find())
        return jsonify([serialize_task(t) for t in tasks]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------
# DELETE
# -------------------------------
@todo_bp.route("/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    try:
        result = get_todo_collection().delete_one({"_id": ObjectId(task_id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Task not found"}), 404
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e: 
        return jsonify({"error": str(e)}), 500

