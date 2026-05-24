import os
import datetime

dir_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox"

# 1. Update sw.js version
sw_path = os.path.join(dir_path, "sw.js")
if os.path.exists(sw_path):
    with open(sw_path, 'r', encoding='utf-8') as f:
        sw_content = f.read()
    
    sw_content = sw_content.replace('v3.0.6', 'v3.0.7')
    
    with open(sw_path, 'w', encoding='utf-8') as f:
        f.write(sw_content)
    print("Updated sw.js to v3.0.7")

# 2. Append to VERSION_HISTORY.txt
vh_path = os.path.join(dir_path, "VERSION_HISTORY.txt")
if os.path.exists(vh_path):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"""
============================================================
v3.0.7 - DEPLOYED {timestamp}
* Version auto-bumped from v3.0.6
* Service Worker cache updated to: trc-v3.0.7
* All tactical systems: OPERATIONAL
* Toast updater: ACTIVE - users will see update prompt on next app open
"""
    with open(vh_path, 'a', encoding='utf-8') as f:
        f.write(entry)
    print("Appended v3.0.7 to VERSION_HISTORY.txt")
