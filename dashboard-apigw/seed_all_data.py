import csv
import os
import sys

# Add working directory to path so we can import app
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.infrastructure import Application, Environment, Server, Service
from app.models.ske import SKEEnvironment, SKEService
from app.core.encryption import encrypt_password

def seed_data():
    db = SessionLocal()
    try:
        # Load Applications
        print("Seeding Applications...")
        with open('apps.csv', mode='r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                app = Application(
                    itam_id=int(row['itam_id']),
                    name=row['name'],
                    description=row.get('description')
                )
                db.add(app)
        db.flush()

        # Load Environments
        print("Seeding Environments...")
        with open('envs.csv', mode='r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                env = Environment(
                    itam_id=int(row['itam_id']),
                    env_id=row['env_id'],
                    name=row['name'],
                    status=row.get('status', 'healthy')
                )
                db.add(env)
        db.flush()

        # Load Servers
        print("Seeding Servers...")
        with open('servers.csv', mode='r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                envs_raw = row.get("environments", row.get("env_id", ""))
                environments = [e.strip() for e in envs_raw.split(',') if e.strip()] if envs_raw else []
                server = Server(
                    itam_id=int(row['itam_id']),
                    ip_address=row['ip_address'],
                    username=row['username'],
                    password=encrypt_password(row.get('password', 'Welcome@123')),
                    hostname=row['hostname'],
                    role=row.get('role'),
                    status=row.get('status', 'Online'),
                    category=row.get('category', 'Non-Production'),
                    os=row.get('os'),
                    cpu=row.get('cpu'),
                    memory=row.get('memory'),
                    environments=environments
                )
                db.add(server)
        db.flush()

        # Load SKE Environments
        print("Seeding SKE Environments...")
        with open('ske_envs.csv', mode='r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                ske_env = SKEEnvironment(
                    ske_env_id=row['ske_env_id'],
                    name=row['name'],
                    status=row.get('status', 'Healthy')
                )
                db.add(ske_env)
        db.flush()

        # Load SKE Services
        print("Seeding SKE Services...")
        with open('ske_services.csv', mode='r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                ske_svc = SKEService(
                    ske_env_id=row['ske_env_id'],
                    namespace=row.get('namespace', 'default'),
                    service_id=row['service_id'],
                    name=row['name'],
                    replicas=int(row.get('replicas', 1)),
                    version=row.get('version', 'latest'),
                    status=row.get('status', 'running')
                )
                db.add(ske_svc)

        db.commit()
        print("Success! Database seeded.")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
