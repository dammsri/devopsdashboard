import csv
import io
from app.db.session import SessionLocal
from app.models.infrastructure import Server

db = SessionLocal()

with open("../servers.csv", "r") as f:
    csv_reader = csv.DictReader(f)
    for row in csv_reader:
        envs_raw = row.get("environments", row.get("env_id", ""))
        environments = [e.strip() for e in envs_raw.split(',') if e.strip()] if envs_raw else []
        print(environments)
        item = Server(
            itam_id=int(row.get("itam_id", row.get("app_id"))),
            ip_address=row["ip_address"],
            username=row["username"],
            password="encrypted",
            hostname=row["hostname"],
            role=row.get("role"),
            status=row.get("status", "Online"),
            environments=environments
        )
        db.add(item)
    try:
        db.commit()
        print("Success")
    except Exception as e:
        print("Error:", e)
