import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace the DRAFT SNAPSHOT version
html = re.sub(r'DRAFT SNAPSHOT v2\.14\.17-PROD', 'DRAFT SNAPSHOT v2.14.18-PROD', html)

# 2. Add window.APP_VERSION and the new API logic
new_script = '''
    <script>
        window.APP_VERSION = 'v2.14.18-PROD';

        window.addEventListener('load', () => {
            // Register SW silently for offline support
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('./sw.js?v=' + window.APP_VERSION).catch(err => console.log('SW reg failed', err));
            }

            // Check API for new version
            fetch('/api/check-version')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success' && data.latest_version && data.latest_version !== window.APP_VERSION) {
                        showUpdateModal(data.latest_version);
                    }
                }).catch(err => console.log('Update check failed:', err));
        });

        function showUpdateModal(newVersion) {
            if (document.getElementById('twa-update-modal')) return;
            const modal = document.createElement('div');
            modal.id = 'twa-update-modal';
            modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 1000000; display: flex; align-items: center; justify-content: center; font-family: monospace; padding: 20px;';
            
            modal.innerHTML = \
                <div style="background-color: #0f172a; border: 1px solid #3b82f6; border-radius: 12px; padding: 24px; max-width: 400px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
                    <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 12px; color: #60a5fa; margin-top: 0;">Update Available</h2>
                    <p style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 24px; line-height: 1.5;">
                        Version \ is ready to install.<br><br>
                        By clicking <b>Accept & Update</b>, you agree to the latest Privacy Policy and End User License Agreement.
                    </p>
                    <div style="display: flex; justify-content: flex-end; gap: 12px;">
                        <button id="modal-remind-btn" style="background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; text-transform: uppercase; font-family: monospace;">Remind Me Later</button>
                        <button id="modal-update-btn" style="background: #3b82f6; border: none; color: white; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; text-transform: uppercase; font-family: monospace; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);">Accept & Update</button>
                    </div>
                </div>
            \;
            
            document.body.appendChild(modal);
            
            document.getElementById('modal-remind-btn').onclick = () => {
                modal.remove();
            };
            
            document.getElementById('modal-update-btn').onclick = () => {
                document.getElementById('modal-update-btn').innerText = 'UPDATING...';
                // Force reload to grab the new version from the server
                window.location.reload(true);
            };
        }
'''

# We want to replace everything from <!-- PWA SERVICE WORKER REGISTRATION... to } // end showUpdateToast
# The easiest way is regex substitution

pattern = r'<!-- PWA SERVICE WORKER REGISTRATION & DYNAMIC UPDATE TOAST -->.*?// CUSTOM PWA INSTALL PROMPT \(TACTICAL TOAST\)'
replacement = f'<!-- PWA SERVICE WORKER REGISTRATION & API UPDATE CHECK -->\n{new_script}\n\n        // =========================================================================\n        // CUSTOM PWA INSTALL PROMPT (TACTICAL TOAST)'

html = re.sub(pattern, replacement, html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
