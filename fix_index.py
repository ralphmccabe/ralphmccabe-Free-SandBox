import os
import re

index_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox\index.html"
with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove 'truncate' from all DOPE card headers to prevent html2canvas vertical clipping
content = content.replace('class="text-blue-800 font-normal truncate"', 'class="text-blue-800 font-normal leading-tight"')
content = content.replace('class="text-blue-800 font-bold truncate text-right"', 'class="text-blue-800 font-bold leading-tight text-right"')

# 2. Inject custom modal HTML for Save Profile
modal_html = """
    <!-- CUSTOM SAVE PROFILE MODAL -->
    <div id="save-profile-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000000] flex items-center justify-center p-4 font-mono">
        <div class="bg-slate-900 border border-blue-500 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 class="text-xl font-bold mb-3 text-blue-400 mt-0 uppercase tracking-wider">Save Tactical Record</h2>
            <p class="text-sm text-slate-300 mb-4 leading-relaxed">
                Enter profile name to save current session to your secure vault:
            </p>
            <input type="text" id="save-profile-input" class="w-full bg-black border border-slate-600 rounded p-3 text-white focus:outline-none focus:border-blue-500 mb-6 uppercase" placeholder="PROFILE NAME..." maxlength="30" autocomplete="off">
            <div class="flex justify-end gap-3">
                <button id="save-profile-cancel" class="bg-transparent border border-slate-600 text-slate-400 px-4 py-2 rounded font-bold uppercase hover:text-white transition-colors">Cancel</button>
                <button id="save-profile-confirm" class="bg-blue-600 border-none text-white px-4 py-2 rounded font-bold uppercase shadow-[0_4px_6px_-1px_rgba(59,130,246,0.5)] hover:bg-blue-500 transition-colors">Save To Vault</button>
            </div>
        </div>
    </div>
"""

if 'id="save-profile-modal"' not in content:
    # Inject it right before the PWA SERVICE WORKER REGISTRATION script block
    content = content.replace('<!-- PWA SERVICE WORKER REGISTRATION & API UPDATE CHECK -->', modal_html + '\n    <!-- PWA SERVICE WORKER REGISTRATION & API UPDATE CHECK -->')

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html updated with fixes.")
