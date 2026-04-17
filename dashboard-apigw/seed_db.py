import os
import sys

# Add the current directory to sys.path to allow importing from 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.db.init_db import init_db

def seed():
    print("🚀 Initializing Clean Database for DevOps Dashboard...")
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    print("✅ Database initialization and admin seeding completed.")

if __name__ == "__main__":
    seed()
