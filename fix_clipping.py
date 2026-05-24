import os

index_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox\index.html"
with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_css = '#card-container span[id^="display-"] { display: inline-block; line-height: normal; word-break: break-all; overflow-wrap: anywhere; }'
new_css = '#card-container span[id^="display-"] { word-break: break-all; overflow-wrap: anywhere; }'

content = content.replace(old_css, new_css)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed inline-block and line-height from the display spans CSS.")
