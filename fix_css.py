import os
import re

dir_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox"

# 1. Fix the flexbox truncation in the Library (original_script.js)
for script_name in ["original_script.js", "original_script.min.js"]:
    script_path = os.path.join(dir_path, script_name)
    if os.path.exists(script_path):
        with open(script_path, 'r', encoding='utf-8') as f:
            script_content = f.read()
        
        # Add min-w-0 to the flex-1 container that holds the title so truncate actually works
        script_content = script_content.replace(
            '<div class="flex-1">',
            '<div class="flex-1 min-w-0">'
        )
        
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)

# 2. Fix the unbroken string spilling in the main card display (index.html)
index_path = os.path.join(dir_path, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

# Add CSS rules to force unbreakable strings to wrap or truncate
old_css = '#card-container span[id^="display-"] { display: inline-block; line-height: normal; }'
new_css = '#card-container span[id^="display-"] { display: inline-block; line-height: normal; word-break: break-all; overflow-wrap: anywhere; }'
index_content = index_content.replace(old_css, new_css)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(index_content)

print("Applied CSS wrap and truncation fixes.")
