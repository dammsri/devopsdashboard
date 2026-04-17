from app.db.session import SessionLocal
from app.models.infrastructure import Application, Server

db = SessionLocal()
try:
    # Verify test data exists
    app = db.query(Application).filter(Application.itam_id == 99999).first()
    server = db.query(Server).filter(Server.itam_id == 99999).first()
    
    if app and server:
        print(f"✅ Test application '{app.name}' and server '{server.hostname}' exist.")
        
        # Perform deletion
        print(f"🗑️ Deleting application {app.itam_id}...")
        db.delete(app)
        db.commit()
        
        # Check if server still exists
        server_check = db.query(Server).filter(Server.itam_id == 99999).first()
        if not server_check:
            print("✨ SUCCESS: Server was automatically deleted by cascade!")
        else:
            print("❌ FAILURE: Server still exists in the database.")
    else:
        print("❌ ERROR: Test data was not found.")
finally:
    db.close()
