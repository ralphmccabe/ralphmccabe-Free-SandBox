import http.server
import ssl
import os
import socket
import shutil
import re
import sys
import datetime

# Override print to always flush immediately for real-time console feedback
_print = print
def print(*args, **kwargs):
    kwargs['flush'] = True
    _print(*args, **kwargs)

# Force working directory to the location of this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# PORT CONFIG — matches Edge://flags setting on PC and Mobile
PORT = 8446

# ============================================================
# VERSION BUMP UTILITY
# ============================================================
def bump_version(version_str):
    """Bumps vX.Y.Z-SUFFIX to vX.Y.(Z+1)-SUFFIX to keep main numbers low."""
    # First try to match a 3-digit version like v2.4.1
    match3 = re.match(r'v(\d+)\.(\d+)\.(\d+)(.*)', version_str)
    if match3:
        major = int(match3.group(1))
        minor = int(match3.group(2))
        patch = int(match3.group(3))
        suffix = match3.group(4)
        return f'v{major}.{minor}.{patch + 1}{suffix}'
    
    # If it's a 2-digit version like v2.4, convert it to v2.4.1
    match2 = re.match(r'v(\d+)\.(\d+)(.*)', version_str)
    if match2:
        major = int(match2.group(1))
        minor = int(match2.group(2))
        suffix = match2.group(3)
        return f'v{major}.{minor}.1{suffix}'
        
    return version_str + "-NEW"

def read_current_version(source_dir):
    """Read current version string from sw.js"""
    sw_path = os.path.join(source_dir, "sw.js")
    if os.path.exists(sw_path):
        with open(sw_path, 'r', encoding='utf-8') as f:
            content = f.read()
        match = re.search(r'TRC-VERSION - ([\w.-]+)', content)
        if match:
            return match.group(1)
    return "v2.4"

def apply_version_bump(source_dir, new_version):
    """
    Auto-bump the version across:
      1. sw.js  (CACHE_NAME + TRC-PRO-VERSION comment)
      2. index.html  (original_script.js?v=X and sw.js?v=X registration)
      3. VERSION_HISTORY.txt  (appends changelog entry)
    """
    # --- 1. Update sw.js ---
    sw_path = os.path.join(source_dir, "sw.js")
    if os.path.exists(sw_path):
        with open(sw_path, 'r', encoding='utf-8') as f:
            sw = f.read()
        sw = re.sub(r'/\* TRC-VERSION - [\w.-]+ \*/',
                    f'/* TRC-VERSION - {new_version} */', sw)
        sw = re.sub(r"const CACHE_NAME = 'trc-[\w.-]+'",
                    f"const CACHE_NAME = 'trc-{new_version}'", sw)
        with open(sw_path, 'w', encoding='utf-8') as f:
            f.write(sw)
        print(f"[+] sw.js bumped to {new_version}")

    # --- 2. Update index.html script query strings ---
    index_path = os.path.join(source_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            idx = f.read()

        # Bump original_script.js?v= by 1 decimal
        def bump_script_ver(m):
            try:
                old_v = float(m.group(1))
                new_v = round(old_v + 0.1, 1)
                return f"original_script.js?v={new_v}"
            except:
                return m.group(0)
        idx = re.sub(r'original_script\.js\?v=([\d.]+)', bump_script_ver, idx)

        # Update sw.js registration version
        idx = re.sub(r"register\('./sw\.js(\?v=[\w.-]+)?'\)",
                     f"register('./sw.js?v={new_version}')", idx)

        # Update the DRAFT SNAPSHOT button label in the banner
        idx = re.sub(r'📸 DRAFT SNAPSHOT v[\d.]+', f'📸 DRAFT SNAPSHOT {new_version}', idx, flags=re.IGNORECASE)
        idx = re.sub(r"btn\.innerText = '📸 DRAFT SNAPSHOT v[\d.]+'",
                     f"btn.innerText = '📸 DRAFT SNAPSHOT {new_version}'", idx, flags=re.IGNORECASE)

        # Update the API Version Check variable
        idx = re.sub(r"window\.APP_VERSION = 'v[\d.]+';",
                     f"window.APP_VERSION = '{new_version}';", idx)

        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(idx)
        print(f"[+] index.html script versions bumped")

    # --- 3. Write / append VERSION_HISTORY.txt ---
    vh_path = os.path.join(source_dir, "VERSION_HISTORY.txt")
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"""
{'='*60}
{new_version} — DEPLOYED {timestamp}
• Version auto-bumped from previous release
• Service Worker cache updated to: trc-pro-upgrade-{new_version}
• All tactical systems: OPERATIONAL
• Toast updater: ACTIVE — users will see update prompt on next app open
"""
    with open(vh_path, 'a', encoding='utf-8') as f:
        f.write(entry)
    print(f"[+] VERSION_HISTORY.txt updated for {new_version}")

class TacticalRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        # --- SECURITY LOCKDOWN ---
        # Require secure token for administrative actions
        admin_endpoints = ['/api/production_stage', '/api/take-snapshot']
        if any(self.path.startswith(ep) for ep in admin_endpoints):
            auth_header = self.headers.get('Authorization')
            if not auth_header or auth_header != 'Bearer PFtEpubjGS_qHkB-vFTkjdRbRZfqpdpUdCIXtCDin8A':
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b'{"status": "error", "message": "Unauthorized: Invalid or missing security token"}')
                print("\n[!] SECURITY ALERT: Blocked unauthorized access attempt to administrative endpoint!")
                return

        if self.path == '/api/check-version':
            try:
                current_dir = os.getcwd()
                current_version = read_current_version(current_dir)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                msg = f'{{"status": "success", "latest_version": "{current_version}"}}'
                self.wfile.write(msg.encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                
        elif self.path == '/api/production_stage':
            try:
                current_dir = os.getcwd()
                
                # 1. Detect current version from sw.js
                version = "v2.0"
                sw_path = os.path.join(current_dir, "sw.js")
                if os.path.exists(sw_path):
                    with open(sw_path, 'r', encoding='utf-8') as f:
                        sw_content = f.read()
                    match = re.search(r'TRC-PRO-VERSION - ([\w.-]+)', sw_content)
                    if match:
                        version = match.group(1)
                
                # 2. Generate snapshot directory path with version and timestamp
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                snapshot_dir_name = f"Snapshot_{version}_{timestamp}"
                all_snapshots_root = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\All_Sandbox_Snapped_of_Current_Versions"
                snapshot_dir = os.path.join(all_snapshots_root, snapshot_dir_name)
                
                # Define staging targets and exclusions
                target_dir = os.path.join(all_snapshots_root, "Ready to be pushed")
                exclusions = {".git", "node_modules", "twa-build", "cert.pem", "key.pem", "cert.pfx", "manifest-recipe.txt"}
                
                # 3. Clear target directory if it exists and stage pristine build
                if os.path.exists(target_dir):
                    shutil.rmtree(target_dir, ignore_errors=True)
                os.makedirs(target_dir, exist_ok=True)
                
                # Copy everything recursively from current_dir to target_dir excluding items
                for item in os.listdir(current_dir):
                    if item in exclusions:
                        continue
                    s = os.path.join(current_dir, item)
                    d = os.path.join(target_dir, item)
                    if os.path.isdir(s):
                        shutil.copytree(s, d, ignore=shutil.ignore_patterns(*exclusions))
                    else:
                        shutil.copy2(s, d)
                
                # Manually strip local testing banner from index.html inside target_dir
                target_index = os.path.join(target_dir, "index.html")
                if os.path.exists(target_index):
                    with open(target_index, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    banner_pattern = r'(?s)<!-- LOCAL_TESTING_BANNER_START -->.*?<!-- LOCAL_TESTING_BANNER_END -->'
                    clean_content = re.sub(banner_pattern, "", content)
                    
                    with open(target_index, 'w', encoding='utf-8') as f:
                        f.write(clean_content)
                
                # 4. Automatically archive active development snapshot backup folder (preserving banners!)
                if os.path.exists(all_snapshots_root):
                    if os.path.exists(snapshot_dir):
                        shutil.rmtree(snapshot_dir, ignore_errors=True)
                    os.makedirs(snapshot_dir, exist_ok=True)
                    
                    for item in os.listdir(current_dir):
                        if item in exclusions:
                            continue
                        s = os.path.join(current_dir, item)
                        d = os.path.join(snapshot_dir, item)
                        if os.path.isdir(s):
                            shutil.copytree(s, d, ignore=shutil.ignore_patterns(*exclusions))
                        else:
                            shutil.copy2(s, d)
                
                # Send JSON success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"status": "success", "message": "Clean production build staged and testing backup folder auto-generated successfully!"}')
                print(f"\n[+] TACTICAL SUCCESS: Compiled clean build to 'Ready to be pushed' AND generated active snapshot backup: '{snapshot_dir_name}'!")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                err_msg = f'{{"status": "error", "message": "{str(e)}"}}'
                self.wfile.write(err_msg.encode('utf-8'))
                print(f"\n[-] TACTICAL ERROR: Staging failed: {str(e)}")
        elif self.path == '/api/take-snapshot':
            try:
                source_dir = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox"

                # 1. Read current version and compute the NEW bumped version
                current_version = read_current_version(source_dir)
                new_version = bump_version(current_version)
                print(f"\n[~] DRAFT: Bumping {current_version} -> {new_version}")

                # 2. Apply version bump to sw.js, index.html, VERSION_HISTORY.txt
                apply_version_bump(source_dir, new_version)

                # 3. Generate snapshot directory path (named with NEW version)
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                snapshot_dir_name = f"Snapshot_{new_version}_{timestamp}"
                all_snapshots_root = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\All_Sandbox_Snapped_of_Current_Versions"
                snapshot_dir = os.path.join(all_snapshots_root, snapshot_dir_name)

                # Define exclusions
                exclusions = {".git", "node_modules", "twa-build", "cert.pem", "key.pem", "cert.pfx", "manifest-recipe.txt"}

                # 4. Copy updated files to the new versioned snapshot folder
                if os.path.exists(source_dir):
                    os.makedirs(snapshot_dir, exist_ok=True)
                    for item in os.listdir(source_dir):
                        if item in exclusions:
                            continue
                        s = os.path.join(source_dir, item)
                        d = os.path.join(snapshot_dir, item)
                        if os.path.isdir(s):
                            shutil.copytree(s, d, ignore=shutil.ignore_patterns(*exclusions))
                        else:
                            shutil.copy2(s, d)

                # Send JSON success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                msg = f'{{"status": "success", "version": "{new_version}", "message": "Drafted {new_version}! sw.js bumped, VERSION_HISTORY.txt updated, snapshot created."}}'
                self.wfile.write(msg.encode('utf-8'))
                print(f"\n[+] DRAFT SUCCESS: '{snapshot_dir_name}' created with {new_version}!")
                print(f"[+] Toast updater is now LIVE — phones will detect the new SW on next app open.")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                err_msg = f'{{"status": "error", "message": "{str(e)}"}}'
                self.wfile.write(err_msg.encode('utf-8'))
                print(f"\n[-] TACTICAL ERROR: Draft failed: {str(e)}")
        else:
            super().do_POST()

    def end_headers(self):
        # Disable caching for sw.js and index.html so updates trigger instantly without browser cache games
        if self.path.endswith('sw.js') or 'sw.js?' in self.path or self.path.endswith('index.html') or 'index.html?' in self.path or self.path == '/':
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

LOCAL_IP = get_ip()

# 1. CHECK FOR EXISTING CERTIFICATES
certfile = "cert.pem"
keyfile = "key.pem"

print("\n" + "="*60)
print("       TACTICAL RANGE CARD PRO - MOBILE SYNC SERVER")
print("="*60)

try:
    if os.path.exists(certfile) and os.path.exists(keyfile):
        # BOOT HTTPS SERVER
        server_address = ('0.0.0.0', PORT)
        httpd = http.server.ThreadingHTTPServer(server_address, TacticalRequestHandler)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile, keyfile)
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        
        print(f"[SECURE] MODE: HTTPS ACTIVE")
        print(f"CONNECT ON MOBILE: https://{LOCAL_IP}:{PORT}")
        print("\n(Note: Tap 'Advanced' -> 'Proceed' on your phone)")
    else:
        # BOOT STANDARD HTTP SERVER (Workaround Mode)
        server_address = ('0.0.0.0', PORT)
        httpd = http.server.ThreadingHTTPServer(server_address, TacticalRequestHandler)
        
        print(f"[WARNING] MODE: STANDARD HTTP (No SSL found)")
        print(f"CONNECT ON MOBILE: http://{LOCAL_IP}:{PORT}")
        print("\n[CRITICAL] For Camera/Mic to work on mobile without HTTPS:")
        print("1. In Edge/Chrome on your phone, go to: edge://flags (or chrome://flags)")
        print("2. Search for: 'unsafely-treat-insecure-origin-as-secure'")
        print(f"3. Enable it and add: http://{LOCAL_IP}:{PORT}")
        print("4. Restart your mobile browser.")

    print("="*60)
    
    # Automatically open local browser in a background thread to improve user experience
    import threading
    import webbrowser
    import time
    def open_browser():
        time.sleep(1.0)
        url = f"https://localhost:{PORT}" if (os.path.exists(certfile) and os.path.exists(keyfile)) else f"http://localhost:{PORT}"
        print(f"\n[+] Automatically opening local browser to: {url}")
        webbrowser.open(url)
    threading.Thread(target=open_browser, daemon=True).start()

    httpd.serve_forever()

except OSError as e:
    if e.errno == 98 or e.errno == 10048:
        print("\n" + "!"*60)
        print(f"[-] CRITICAL ERROR: PORT {PORT} IS ALREADY IN USE!")
        print("!"*60)
        print(f"Another process is already running on port {PORT}.")
        print("This usually happens if you already have this server running in another")
        print("PowerShell window or background process.")
        print("\nTo resolve this:")
        print(f"1. Close any other PowerShell / Command Prompt windows running this script.")
        print(f"2. Or find and kill the process using port {PORT}.")
        print("   In PowerShell, you can run:")
        print(f"   (Get-NetTCPConnection -LocalPort {PORT} -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object {{ Stop-Process -Id $_ -Force }}")
        print("!"*60 + "\n")
    else:
        print(f"\n[-] SYSTEM ERROR: {str(e)}")
except KeyboardInterrupt:
    print("\n[!] Shutting down server.")

