

# How to run the project
```
venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info > backend.log 2>&1 & echo $!

venv/bin/python3 app/main.py > telemetry_podman.log 2>&1 & echo $!

venv/bin/python3 app/main.py > telemetry_ske.log 2>&1 & echo $!

/opt/homebrew/opt/node@24/bin/npm run dev -- --host 0.0.0.0 > frontend.log 2>&1 & echo $!

cd dashboard-apigw
venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

cd dashboard-telemetry-podman
venv/bin/python3 app/main.py

cd dashboard-telemetry-ske
venv/bin/python3 app/main.py

cd dashboard-frontend
/opt/homebrew/opt/node@24/bin/npm run dev -- --host 0.0.0.0
```
## Start services
```

cd dashboard-apigw && venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 & echo $! && cd ../dashboard-telemetry-podman && PYTHONPATH=. venv/bin/python3 -m app.main > telemetry_podman.log 2>&1 & echo $! && cd ../dashboard-telemetry-ske && PYTHONPATH=. venv/bin/python3 -m app.main > telemetry_ske.log 2>&1 & echo $! && cd ../dashboard-frontend && export PATH=/opt/homebrew/opt/node@24/bin:$PATH && /opt/homebrew/opt/node@24/bin/npm run dev -- --host 0.0.0.0 > frontend.log 2>&1 & echo $!

dashboard-apigw/venv/bin/pip install -r dashboard-apigw/requirements.txt && dashboard-telemetry-podman/venv/bin/pip install -r dashboard-telemetry-podman/requirements.txt && dashboard-telemetry-ske/venv/bin/pip install -r dashboard-telemetry-ske/requirements.txt

dashboard-apigw/venv/bin/pip install ldap3 apscheduler requests httpx pytest pytest-asyncio email-validator

lsof -i :8001,8002,5173 && cd dashboard-apigw && venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 & echo $!

dashboard-apigw/venv/bin/pip freeze > dashboard-apigw/requirements.txt && dashboard-telemetry-podman/venv/bin/pip freeze > dashboard-telemetry-podman/requirements.txt && dashboard-telemetry-ske/venv/bin/pip freeze > dashboard-telemetry-ske/requirements.txt

curl -s http://localhost:8000/health && echo "" && curl -s http://localhost:8001/health && echo "" && curl -s http://localhost:8002/health && echo "" && curl -s -I http://localhost:5173/ | head -n 1

dashboard-apigw/venv/bin/pip show passlib bcrypt

kill 6832 && sleep 2 && rm devopsdashboard.db && source venv/bin/activate && export ENCRYPTION_KEY="yDy20Mbkm2Fpagsvd5llfgSbKzr1QJuBC4b5FV_A-yA=" && python3 -m app.db.init_db && python3 -m app.api.v1.import_data && nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

```
I will use curl to verify the /health or /metrics endpoints for each service.
APIGW: http://localhost:8000/health
Telemetry-Podman: http://localhost:8001/health
Telemetry-SKE: http://localhost:8002/health
Frontend: http://localhost:5173/ (checking for 200 OK)

## Get an Access Token

```
# Login to get the access token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "admin", "password": "Admin@123"}' | dashboard-apigw/venv/bin/python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo $TOKEN
```

## Applications and Environments
```
# List all Applications
curl -X GET http://localhost:8000/api/v1/applications/ \
  -H "Authorization: Bearer $TOKEN"

# Get Environment Details (e.g., App 17028, Env 'dev')
curl -X GET http://localhost:8000/api/v1/applications/17028/environments/dev \
  -H "Authorization: Bearer $TOKEN"

# Update an Environment
curl -X PUT http://localhost:8000/api/v1/applications/17028/environments/dev \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Development Scoped"}'
```

## Infrastructure Servers
```
# List all Servers
curl -X GET http://localhost:8000/api/v1/infrastructure/servers \
  -H "Authorization: Bearer $TOKEN"

# Get Infrastructure Groups (Tier overview)
curl -X GET http://localhost:8000/api/v1/infrastructure/groups \
  -H "Authorization: Bearer $TOKEN"

```

## SKE Clusters
```
# List all SKE Clusters
curl -X GET http://localhost:8000/api/v1/ske-clusters/ \
  -H "Authorization: Bearer $TOKEN"

# List Services for a specific Cluster (e.g., 'ske-stg')
curl -X GET http://localhost:8000/api/v1/ske-clusters/ske-stg/services \
  -H "Authorization: Bearer $TOKEN"

# Delete an SKE Service
curl -X DELETE http://localhost:8000/api/v1/ske-clusters/ske-stg/services/notification \
  -H "Authorization: Bearer $TOKEN"
```

## System
```
# Get Current User Info
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# List Background Jobs
curl -X GET http://localhost:8000/api/v1/settings/ops/jobs \
  -H "Authorization: Bearer $TOKEN"

```