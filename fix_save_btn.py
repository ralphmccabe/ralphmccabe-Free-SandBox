import os

js_path = r'C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox\original_script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_logic = '''    saveProfileBtn.onclick = () => {
        const name = prompt("Enter profile name to save tactical record:");
        if (!name) return;

        const existingProfiles = getProfiles();
        const lowerName = name.trim().toLowerCase();
        const nameExists = Object.keys(existingProfiles).some(k => k.trim().toLowerCase() === lowerName);
        if (nameExists) {
            alert("NAME ALREADY EXIST");
            return;
        }

        const dopeCount = Object.keys(existingProfiles).filter(k => !existingProfiles[k].isReconScenario).length;
        if (dopeCount >= 20) {
            alert("LIBRARY FULL: DOPE CACHE CAPACITY REACHED (20/20). PLEASE DELETE OLD CARDS FIRST.");
            return;
        }

        const container = document.getElementById('card-container');
        const previewPanel = document.getElementById('previewPanel');

        // Save current states to restore later
        const isVisuallyHidden = previewPanel.classList.contains('opacity-0');
        const originalTransform = container.style.transform;
        const originalScrollY = window.scrollY;

        // PRE-CAPTURE NORMALIZATION
        // 1. Show panel if hidden
        if (isVisuallyHidden) {
            previewPanel.classList.remove('opacity-0', 'pointer-events-none', 'absolute');
            previewPanel.classList.add('flex');
        }
        // 2. Reset scaling transform to capture at full resolution
        container.style.transform = 'none';
        // 3. Scroll to top to ensure coordinate sync
        window.scrollTo(0, 0);

        // EXTRA SAFETY: Disable transitions temporarily to avoid animation interference with html2canvas
        const originalTransition = previewPanel.style.transition;
        previewPanel.style.transition = 'none';

        // INDUSTRIAL FIX: Force fixed capture context
        document.body.classList.add('is-capturing');

        // DELAY for layout reflow and animation suppression
        setTimeout(() => {
            html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1000,
                windowHeight: 750
            }).then(canvas => {
                // Restore context
                document.body.classList.remove('is-capturing');
                previewPanel.style.transition = originalTransition;

                // POST-CAPTURE RESTORATION
                if (isVisuallyHidden) {
                    previewPanel.classList.add('opacity-0', 'pointer-events-none', 'absolute');
                    previewPanel.classList.remove('flex');
                }
                container.style.transform = originalTransform;
                window.scrollTo(0, originalScrollY);

                const snapshot = canvas.toDataURL("image/jpeg", 0.7);
                const data = { snapshot };

                inputs.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) data[id] = el.value;
                });

                // Read and save interactive canvas coordinates
                const canvasShot = document.getElementById('canvas-shot');
                const canvasHold = document.getElementById('canvas-hold');
                if (canvasShot && canvasShot.getShots) data.shotPoints = canvasShot.getShots();
                if (canvasHold && canvasHold.getShots) data.holdPoints = canvasHold.getShots();

                // Save drawings as data URLs
                const pCanvas = document.getElementById('pencil-canvas');
                const gCanvas = document.getElementById('grade-canvas');
                if (pCanvas) data.pencilDrawing = pCanvas.toDataURL();
                if (gCanvas) data.gradeDrawing = gCanvas.toDataURL();

                const ps = getProfiles();
                ps[name] = data;
                
                const postSave = () => {
                    window.currentLibraryFilter = 'all';
                    window.openLibrary();
                    window.previewProfile(name);
                };

                if (window.TRC_IDB) {
                    window.TRC_IDB.set('rangeCardProfiles', name, data)
                        .then(() => {
                            if (window.loadedProfilesCache) window.loadedProfilesCache[name] = data;
                            postSave();
                        })
                        .catch(err => {
                            console.error("IDB Save Error:", err);
                            alert("SAVE FAILED. ERROR IN SECURE VAULT.");
                        });
                } else {
                    localStorage.setItem('rangeCardProfiles', JSON.stringify(ps));
                    postSave();
                }
            }).catch(err => {
                document.body.classList.remove('is-capturing');
                previewPanel.style.transition = originalTransition;
                if (isVisuallyHidden) {
                    previewPanel.classList.add('opacity-0', 'pointer-events-none', 'absolute');
                    previewPanel.classList.remove('flex');
                }
                container.style.transform = originalTransform;
                window.scrollTo(0, originalScrollY);
                console.error("Capture failure:", err);
                
                if (err && err.name === 'QuotaExceededError' || err.toString().includes('exceeded the quota')) {
                    alert("CRITICAL: Browser memory is 100% full! You must delete old Dope Cards or Recon Maps from the library before you can save this one.");
                } else {
                    alert("Record save failed. Please check log.");
                }
            });
        }, 500); // Increased to 500ms for absolute stability
    };
'''

lines = lines[:932] + [new_logic] + lines[1093:]
content = ''.join(lines)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(content)

with open(js_path.replace('.js', '.min.js'), 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESSFULLY REVERTED TO PROMPT")
