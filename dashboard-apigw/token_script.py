import requests
res = requests.post('http://localhost:8000/api/v1/auth/login', json={'user_id': 'admin', 'password': 'Admin@123'})
token = res.json()['access_token']
me = requests.get('http://localhost:8000/api/v1/auth/me', headers={'Authorization': f'Bearer {token}'})
print(me.json())
