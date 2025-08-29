from flask import Blueprint, request, jsonify, send_file
from bson import ObjectId
from datetime import datetime
from gridfs import GridFS
from io import BytesIO
from werkzeug.utils import secure_filename
import os
import traceback
from ..utils.mongo import get_db

archive_bp = Blueprint("archive", __name__, url_prefix="/api/archive")

def get_fs():
    db = get_db()
    return GridFS(db)

@archive_bp.route("/documents", methods=["POST"])
def upload_document():
    """Upload and archive a new document"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    try:
        fs = get_fs()
        filename = secure_filename(file.filename)
        file_id = fs.put(file, filename=filename)

        db = get_db()
        doc = {
            "title": request.form.get("title", filename),
            "description": request.form.get("description", ""),
            "file_id": str(file_id),
            "original_filename": filename,
            "content_type": file.content_type,
            "status": "archived",
            "archived_at": datetime.utcnow(),
            "archived_by": "system",
            "tags": request.form.getlist("tags"),
            "department": request.form.get("department", "general"),
            "retention_until": None,
            "meta": {}
        }
        result = db.documents.insert_one(doc)

        return jsonify({
            "message": "Document archived successfully",
            "id": str(result.inserted_id),
            "file_id": str(file_id)
        }), 201

    except Exception as e:
        print(f"Upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@archive_bp.route("/documents/archived", methods=["GET"])
def list_archived():
    """List all archived documents"""
    try:
        db = get_db()
        query = {"status": "archived"}
        
        docs = list(db.documents.find(query, {
            "_id": 1,
            "title": 1,
            "original_filename": 1,
            "archived_at": 1,
            "content_type": 1,
            "department": 1,
            "tags": 1,
            "description": 1
        }).sort("archived_at", -1))
        
        for doc in docs:
            doc["id"] = str(doc.pop("_id"))
            if isinstance(doc.get("archived_at"), datetime):
                doc["archived_at"] = doc["archived_at"].isoformat()
        
        return jsonify(docs), 200
        
    except Exception as e:
        print(f"Error fetching archived docs: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": "Failed to fetch documents", "details": str(e)}), 500

@archive_bp.route("/documents/<doc_id>/unarchive", methods=["POST"])
def unarchive_document(doc_id):
    """Restore an archived document"""
    try:
        db = get_db()
        result = db.documents.update_one(
            {"_id": ObjectId(doc_id), "status": "archived"},
            {"$set": {
                "status": "active", 
                "restored_at": datetime.utcnow(),
                "restored_by": "system"
            }}
        )
        
        if result.modified_count == 0:
            return jsonify({"error": "Document not found or not archived"}), 404
            
        return jsonify({"message": "Document restored successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@archive_bp.route("/documents/<doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    """Permanently delete a document"""
    try:
        db = get_db()
        fs = get_fs()
        
        doc = db.documents.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            return jsonify({"error": "Document not found"}), 404
            
        if doc.get("retention_until") and doc["retention_until"] > datetime.utcnow():
            if not request.args.get("force", "").lower() in ["true", "1"]:
                return jsonify({
                    "error": "Document is under retention policy",
                    "retention_until": doc["retention_until"].isoformat()
                }), 403
        
        fs.delete(ObjectId(doc["file_id"]))
        db.documents.delete_one({"_id": ObjectId(doc_id)})
        
        return jsonify({"message": "Document deleted permanently"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@archive_bp.route("/documents/<doc_id>/download", methods=["GET"])
def download_document(doc_id):
    """Download an archived document"""
    try:
        db = get_db()
        fs = get_fs()
        
        doc = db.documents.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            return jsonify({"error": "Document not found"}), 404
            
        file = fs.get(ObjectId(doc["file_id"]))
        
        response = send_file(
            BytesIO(file.read()),
            as_attachment=True,
            download_name=doc["original_filename"],
            mimetype=doc["content_type"]
        )
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500