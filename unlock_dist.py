import os

index_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox\index.html"
with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the 'readonly' attribute from the distance inputs
for i in range(100, 1001, 100):
    old_str = f'id="dist-{i}" class="w-full bg-transparent border-none text-[10px] font-extrabold text-neon-green/80 p-0 focus:ring-0 outline-none" value="{i}" maxlength="20" readonly>'
    new_str = f'id="dist-{i}" class="w-full bg-transparent border-none text-[10px] font-extrabold text-neon-green/80 p-0 focus:ring-0 outline-none" value="{i}" maxlength="20">'
    content = content.replace(old_str, new_str)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed readonly from distance inputs!")
