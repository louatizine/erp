from flask import Blueprint, request, jsonify
from datetime import datetime
from ..utils.mongo import get_invoice_collection
from bson import ObjectId

invoice_bp = Blueprint('invoice', __name__, url_prefix='/api/invoices')

@invoice_bp.route("/create", methods=["POST", "OPTIONS"])
def create_invoice():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['invoice_number', 'client_email', 'telephone', 'total_amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create invoice document
        invoice_doc = {
            "invoice_number": data['invoice_number'],
            "client_email": data['client_email'],
            "telephone": data['telephone'],
            "total_amount": float(data['total_amount']),
            "invoice_date": data.get('invoice_date', datetime.utcnow().strftime("%Y-%m-%d")),
            "status": data.get('status', 'pending')
        }
        
        invoice_collection = get_invoice_collection()
        result = invoice_collection.insert_one(invoice_doc)
        
        return jsonify({
            "success": True,
            "invoice_id": str(result.inserted_id)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@invoice_bp.route("/list", methods=["GET"])
def list_invoices():
    try:
        search_term = request.args.get('search', '')
        status_filter = request.args.get('status')

        query = {}
        if search_term:
            query["$or"] = [
                {"client_email": {"$regex": search_term, "$options": "i"}},
                {"company_email": {"$regex": search_term, "$options": "i"}}
            ]
        if status_filter and status_filter != "All":
            query["status"] = status_filter

        invoices = list(get_invoice_collection().find(query).sort("invoice_date", -1))

        for invoice in invoices:
            invoice['_id'] = str(invoice['_id'])

            if 'invoice_date' in invoice and invoice['invoice_date']:
                if isinstance(invoice['invoice_date'], datetime):
                    invoice['invoice_date'] = invoice['invoice_date'].isoformat()
                else:
                    invoice['invoice_date'] = str(invoice['invoice_date'])

            if 'payment_date' in invoice and invoice['payment_date']:
                if isinstance(invoice['payment_date'], datetime):
                    invoice['payment_date'] = invoice['payment_date'].isoformat()
                else:
                    invoice['payment_date'] = str(invoice['payment_date'])
        return jsonify({
            "success": True,
            "invoices": invoices,
            "count": len(invoices)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@invoice_bp.route("/update-status/<invoice_id>", methods=["PATCH"])
def update_invoice_status(invoice_id):
    try:
        data = request.json
        new_status = data.get('status')
        if not new_status:
            return jsonify({"error": "Status is required"}), 400

        update_data = {"status": new_status}

        # If marking as paid, update payment_date
        if new_status == "paid":
            update_data["payment_date"] = datetime.utcnow()

        result = get_invoice_collection().update_one(
            {"_id": ObjectId(invoice_id)},
            {"$set": update_data}
        )

        if result.modified_count == 0:
            return jsonify({"error": "Invoice not found or status unchanged"}), 404

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@invoice_bp.route("/send-reminder/<invoice_id>", methods=["POST"])
def send_payment_reminder(invoice_id):
    try:
        invoice_data = request.get_json()
        client_email = invoice_data.get('client_email')
        invoice_number = invoice_data.get('invoice_number')
        total_amount = invoice_data.get('total_amount')

        if not all([client_email, invoice_number, total_amount]):
            return jsonify({"error": "Missing required fields"}), 400

        subject = f"Rappel de paiement - Facture #{invoice_number}"
        body = f"""
Cher client,

Ceci est un rappel concernant la facture #{invoice_number} d'un montant de {total_amount} Dt qui est actuellement en attente de paiement.

Nous vous prions de bien vouloir procéder au règlement dans les plus brefs délais.

Cordialement,
Dynamix Services
"""
        
        from ..utils.email_utils import send_email
        success = send_email(client_email, subject, body)

        if not success:
            return jsonify({"error": "Failed to send email reminder"}), 500

        return jsonify({"success": True, "message": "Payment reminder sent successfully"})

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
