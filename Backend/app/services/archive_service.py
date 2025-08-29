from datetime import datetime
from bson import ObjectId
from gridfs import GridFS
from ..utils.mongo import get_db

class ArchiveService:
    def __init__(self):
        self.db = get_db()
        self.fs = GridFS(self.db)

    def archive_document(self, file_stream, filename, content_type, user_id, metadata):
        """Archive a new document"""
        file_id = self.fs.put(
            file_stream,
            filename=filename,
            content_type=content_type
        )

        doc = {
            "title": metadata.get("title", filename),
            "description": metadata.get("description", ""),
            "file_id": file_id,
            "original_filename": filename,
            "content_type": content_type,
            "status": "archived",
            "archived_at": datetime.utcnow(),
            "archived_by": user_id,
            "tags": metadata.get("tags", []),
            "department": metadata.get("department", "general"),
            "retention_until": metadata.get("retention_until"),
            "meta": metadata.get("meta", {})
        }

        result = self.db.documents.insert_one(doc)
        return str(result.inserted_id)

    def get_archived_documents(self, filters=None):
        """List archived documents with optional filters"""
        if filters is None:
            filters = {}
        
        query = {"status": "archived", **filters}
        return list(self.db.documents.find(query))

    def restore_document(self, doc_id, user_id):
        """Restore an archived document"""
        result = self.db.documents.update_one(
            {"_id": ObjectId(doc_id), "status": "archived"},
            {"$set": {
                "status": "active",
                "restored_at": datetime.utcnow(),
                "restored_by": user_id
            }}
        )
        return result.modified_count > 0

    def delete_document(self, doc_id, force=False):
        """Permanently delete a document"""
        doc = self.db.documents.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            return False

        # Check retention policy
        if doc.get("retention_until") and doc["retention_until"] > datetime.utcnow() and not force:
            return False

        # Delete from GridFS
        try:
            self.fs.delete(doc["file_id"])
        except Exception:
            pass  # File might already be gone

        # Delete metadata
        self.db.documents.delete_one({"_id": ObjectId(doc_id)})
        return True