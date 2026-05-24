import os
import re

dir_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox"

# 1. Fix CSS truncation in index.html
index_path = os.path.join(dir_path, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

index_content = index_content.replace(
    '#card-container span[id^="display-"] { display: inline-block; transform: translateY(-3px); line-height: normal; }',
    '#card-container span[id^="display-"] { display: inline-block; line-height: normal; }'
)

# 3. Lockdown distance boxes in index.html
for i in range(100, 1001, 100):
    old_input = f'<input type="text" id="dist-{i}" class="w-full bg-transparent border-none text-[10px] font-extrabold text-neon-green/80 p-0 focus:ring-0 outline-none" value="{i}" maxlength="20">'
    new_input = f'<input type="text" id="dist-{i}" class="w-full bg-transparent border-none text-[10px] font-extrabold text-neon-green/80 p-0 focus:ring-0 outline-none" value="{i}" maxlength="20" readonly>'
    index_content = index_content.replace(old_input, new_input)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(index_content)

print("Fixed index.html")

# 2. Fix UNSET in original_script.js and original_script.min.js
for script_name in ["original_script.js", "original_script.min.js"]:
    script_path = os.path.join(dir_path, script_name)
    if os.path.exists(script_path):
        with open(script_path, 'r', encoding='utf-8') as f:
            script_content = f.read()
        
        script_content = script_content.replace(
            "${p.caliber || 'UNSET'}",
            "${p.caliber || '--'}"
        )
        
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        print(f"Fixed {script_name}")

# 4. Fix Weather caching in sw.js
sw_path = os.path.join(dir_path, "sw.js")
if os.path.exists(sw_path):
    with open(sw_path, 'r', encoding='utf-8') as f:
        sw_content = f.read()
    
    old_sw = "if (event.request.url.includes('VERSION_HISTORY.txt')) {"
    new_sw = "if (event.request.url.includes('VERSION_HISTORY.txt') || event.request.url.includes('api.open-meteo.com')) {"
    sw_content = sw_content.replace(old_sw, new_sw)
    
    with open(sw_path, 'w', encoding='utf-8') as f:
        f.write(sw_content)
    print("Fixed sw.js")

