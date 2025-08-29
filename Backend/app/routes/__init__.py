def register_routes(app):
    from .ocr_routes import ocr_bp
    app.register_blueprint(ocr_bp, url_prefix="/api/ocr")
    
def register_routes(app):
    from .ocr_routes import ocr_bp
    from .invoice_routes import invoice_bp
    
    app.register_blueprint(ocr_bp, url_prefix="/api/ocr")
    app.register_blueprint(invoice_bp, url_prefix="/api/invoice")