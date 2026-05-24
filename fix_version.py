import os

index_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox\index.html"
with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("window.APP_VERSION = 'v3.0.6';", "window.APP_VERSION = 'v3.0.9';")

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed window.APP_VERSION in index.html to v3.0.9")
