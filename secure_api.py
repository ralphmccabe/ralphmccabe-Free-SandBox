import os
import secrets

dir_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox"

# 1. Generate a secure token
secure_token = secrets.token_urlsafe(32)

# 2. Update run_secure_server.py
server_path = os.path.join(dir_path, "run_secure_server.py")
with open(server_path, 'r', encoding='utf-8') as f:
    server_content = f.read()

# Replace pushuction with production_stage
server_content = server_content.replace('/api/pushuction', '/api/production_stage')

# Add security check block
security_check = f"""
        # --- SECURITY LOCKDOWN ---
        # Require secure token for administrative actions
        admin_endpoints = ['/api/production_stage', '/api/take-snapshot']
        if any(self.path.startswith(ep) for ep in admin_endpoints):
            auth_header = self.headers.get('Authorization')
            if not auth_header or auth_header != 'Bearer {secure_token}':
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b'{{"status": "error", "message": "Unauthorized: Invalid or missing security token"}}')
                print("\\n[!] SECURITY ALERT: Blocked unauthorized access attempt to administrative endpoint!")
                return
"""

# Insert security check at the beginning of do_POST
server_content = server_content.replace(
    'def do_POST(self):',
    f'def do_POST(self):{security_check}'
)

with open(server_path, 'w', encoding='utf-8') as f:
    f.write(server_content)
print("Secured run_secure_server.py")

# 3. Update index.html
index_path = os.path.join(dir_path, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Replace pushuction with production_stage
index_content = index_content.replace('/api/pushuction', '/api/production_stage')

# Inject token into fetch calls
index_content = index_content.replace(
    "fetch('/api/production_stage', { method: 'POST' })",
    f"fetch('/api/production_stage', {{ method: 'POST', headers: {{ 'Authorization': 'Bearer {secure_token}' }} }})"
)

index_content = index_content.replace(
    "fetch('/api/take-snapshot', { method: 'POST' })",
    f"fetch('/api/take-snapshot', {{ method: 'POST', headers: {{ 'Authorization': 'Bearer {secure_token}' }} }})"
)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(index_content)
print("Secured index.html")
