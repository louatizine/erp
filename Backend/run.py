from app import create_app

print("🚀 Creating Flask app...")
app = create_app()

if __name__ == "__main__":
    print("✅ Running Flask app...")
    app.run(debug=True, port=5000,)