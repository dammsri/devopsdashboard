from app.db.session import SessionLocal, engine
from app.db.init_db import init_db
import logging

logging.basicConfig(level=logging.INFO)
db = SessionLocal()
try:
    print("Creating tables...")
    init_db(db)
    print("Tables created and admin seeded.")
finally:
    db.close()
