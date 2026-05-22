/* 
    TACTICAL RANGE CARD PRO - PRODUCTION CORE v2.1
    SECURITY: AES-256 ENCRYPTED COMMS
*/

// === TACTICAL CRYPTO ENGINE (AES-256) ===
const TacticalCrypto = {
    encrypt: function(data) {
        const secret = localStorage.getItem('trc_team_secret') || 'default_mission_key';
        return CryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
    },
    decrypt: function(cipherText) {
        try {
            const secret = localStorage.getItem('trc_team_secret') || 'default_mission_key';
            const bytes = CryptoJS.AES.decrypt(cipherText, secret);
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        } catch (e) { return null; }
    }
};

function initializeTacticalDashboard1() {

    // === 0. Global Security & Layout Protection ===
    // Enforce a 25-character limit on ALL text boxes to prevent layout breakage
    document.querySelectorAll('input[type="text"]').forEach(el => {
        el.setAttribute('maxlength', '25');
    });

    // type="number" ignores maxlength — enforce 25-char cap globally via JS
    document.querySelectorAll('input[type="number"]').forEach(el => {
        el.addEventListener('input', () => {
            if (el.value.length > 25) el.value = el.value.slice(0, 25);
        });
    });

    // === 1. Setup & Table Generation ===
    const tableBody = document.getElementById('distance-table-body');
    const mobileTableBody = document.getElementById('mobile-distance-table-body'); // NEW
    const distances = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

    // Core inputs that exist in the static HTML
    const inputs = [
        'unit-name', 'call-sign', 'location-name', 'mgrs-coords', 'profile-date',
        'rifle-notes', 'wind-notes', 'scope-notes', 'shooting-angle', 'direction-notes', 'lrf-notes', 'compass-range',
        'compass-range-2', 'box-count-input',
        'sidebar-bal-input-alt', 'sidebar-bal-input-temp', 'sidebar-bal-input-baro',
        // Reload Data
        'caliber', 'zero', 'barrel', 'bullet', 'load', 'powder', 'primer', 'col', 'rings',
        'velocity', 'g1', 'weather', 'targetSize', 'groupSize',
        // Session Info
        'header-notes', 'shooter-name',
        // Solution & Equipment
        'elevation', 'hold-data', 'final-dope'
    ];


    // Generate Distance Table Rows and collect their Input IDs
    distances.forEach((dist) => {
        const clicksId = `clicks-${dist}`;
        const distInputId = `dist-${dist}`;
        const udlrId = `udlr-${dist}`;

        inputs.push(clicksId, udlrId, distInputId);
        
        // 1. Desktop Table Row
        if (tableBody) {
            const row = document.createElement('div');
            row.className = 'grid grid-cols-5 border-b border-black flex-1 items-stretch text-center';
            row.innerHTML = `
                <div class="border-r border-black h-full py-1 flex items-center justify-center font-handwriting text-blue-800 min-w-0 px-0.5 overflow-hidden">
                    <span id="display-${clicksId}" class="break-words leading-none w-full text-center" style="word-break: break-word;"></span>
                </div>
                <div class="col-span-2 border-r border-black h-full py-1 flex items-center justify-center bg-gray-50/30 min-w-0 px-0.5 overflow-hidden">
                    <span id="display-${distInputId}" class="text-sm font-bold break-words leading-none w-full text-center" style="word-break: break-word;">${dist}</span>
                </div>
                <div class="col-span-2 h-full py-1 flex items-center justify-center font-handwriting text-blue-800 min-w-0 px-0.5 overflow-hidden">
                    <span id="display-${udlrId}" class="break-words leading-none w-full text-center" style="word-break: break-word;"></span>
                </div>
            `;
            tableBody.appendChild(row);
        }

        // 2. Mobile Table Row
        if (mobileTableBody) {
            const row = document.createElement('div');
            row.className = 'grid grid-cols-5 border-b border-black flex-1 items-stretch text-center border-l-0 border-r-0';
            row.innerHTML = `
                <div class="border-r border-black h-full py-1 flex items-center justify-center font-handwriting text-blue-800 min-w-0 px-0.5 overflow-hidden">
                    <span id="mobile-display-${clicksId}" class="break-words leading-none w-full text-center" style="word-break: break-word;"></span>
                </div>
                <div class="col-span-2 border-r border-black h-full py-1 flex items-center justify-center bg-gray-50/30 min-w-0 px-0.5 overflow-hidden">
                    <span id="mobile-display-${distInputId}" class="text-[10px] font-bold break-words leading-none w-full text-center" style="word-break: break-word;">${dist}</span>
                </div>
                <div class="col-span-2 h-full py-1 flex items-center justify-center font-handwriting text-blue-800 min-w-0 px-0.5 overflow-hidden">
                    <span id="mobile-display-${udlrId}" class="break-words leading-none w-full text-center" style="word-break: break-word;"></span>
                </div>
            `;
            mobileTableBody.appendChild(row);
        }
    });

    // === 2. Data Syncing (Input -> Card) ===
    inputs.forEach(id => {
        const input = document.getElementById(id);
        const display = document.getElementById(`display-${id}`);
        const mobileDisplay = document.getElementById(`mobile-display-${id}`); // NEW

        if (input) {
            input.addEventListener('input', (e) => {
                if (display) display.textContent = e.target.value;
                if (mobileDisplay) mobileDisplay.textContent = e.target.value; // Sync to mobile field
            });
            // Initial sync
            if (display) display.textContent = input.value;
            if (mobileDisplay) mobileDisplay.textContent = input.value;
        }
    });

    // === 2.1 Barometric Pressure Auto-Formatter ===
    const baroInput = document.getElementById('bal-input-baro');
    if (baroInput) {
        baroInput.addEventListener('input', function(e) {
            // Only format if the user isn't actively backspacing the decimal
            if (e.inputType === 'deleteContentBackward') return;
            
            let val = this.value.replace(/[^0-9]/g, '');
            if (val.length > 2) {
                val = val.substring(0, 2) + '.' + val.substring(2, 4);
            }
            if (this.value !== val) {
                this.value = val;
                // Dispatch input event to trigger the generic sync listener
                this.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    // === 2.5 Dashboard <-> Sidebar Synchronization ===
    // SYNC DISABLED: Dashboard ballistic solver is fully independent of the range card form

    // === 1B. TARGET CANVAS SYSTEM ===
    function initTargetCanvases(type) {
        try {
            const dCanvas = document.getElementById(`canvas-${type}`);
            const mCanvas = document.getElementById(`mobile-canvas-${type}`);
            if (!dCanvas || !mCanvas) return null;

            let shots = [];

            function drawAll() {
                [dCanvas, mCanvas].forEach(canvas => {
                    const ctx = canvas.getContext('2d');
                    const { width, height } = canvas;
                    const centerX = width / 2;
                    const centerY = height / 2;

                    ctx.clearRect(0, 0, width, height);
                    
                    // Draw Concentric Rings
                    ctx.strokeStyle = '#9ca3af';
                    ctx.lineWidth = 1;
                    [0.2, 0.4, 0.6, 0.8].forEach(scale => {
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, (width / 2) * scale, 0, Math.PI * 2);
                        ctx.stroke();
                    });

                    // Draw Crosshairs
                    ctx.strokeStyle = '#6b7280';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
                    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
                    ctx.stroke();

                    // Draw Center Point
                    ctx.fillStyle = type === 'shot' ? '#22c55e' : '#3b82f6';
                    ctx.beginPath(); ctx.arc(centerX, centerY, 3, 0, Math.PI * 2); ctx.fill();

                    // Draw Shots
                    shots.forEach((shot, index) => {
                        const x = shot.nx * width;
                        const y = shot.ny * height;
                        ctx.fillStyle = type === 'shot' ? '#ef4444' : '#f97316';
                        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 7px monospace';
                        ctx.textAlign = 'center';
                        ctx.fillText(index + 1, x, y + 2.5);
                    });
                });
            }

            [dCanvas, mCanvas].forEach(canvas => {
                canvas.addEventListener('mousedown', (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    shots.push({ nx: x / rect.width, ny: y / rect.height });
                    drawAll();
                });
            });

            drawAll();

            return {
                getShots: () => shots,
                setShots: (newShots) => { shots = newShots; drawAll(); },
                clear: () => { shots = []; drawAll(); }
            };
        } catch (e) { return null; }
    }

    window.holdManager = initTargetCanvases('hold');
    window.shotManager = initTargetCanvases('shot');

    // Special handling for date formatting
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
        const displayDate = document.getElementById('display-date');
        const mobileDisplayDate = document.getElementById('mobile-display-date');
        const val = dateInput.value;
        if (displayDate) displayDate.textContent = val;
        if (mobileDisplayDate) mobileDisplayDate.textContent = val;
    }

    // === 3. Canvas Logic (Shots & Holds) ===
    function calculateGroupMetrics(points) {
        if (points.length < 5) return null;
        
        // SAFETY THROTTLE: Max 12 shots for best subset discovery to prevent 2^N exponential lockups
        const workingSet = points.slice(0, 12);
        const n = workingSet.length;
        
        let minSpread = Infinity;
        let bestSubset = [];

        // Efficient Combination Generator: N choose 5
        function getCombinations(idx, currentSubset) {
            if (currentSubset.length === 5) {
                let maxDist = 0;
                for (let a = 0; a < 5; a++) {
                    for (let b = a + 1; b < 5; b++) {
                        const dx = currentSubset[a].nx - currentSubset[b].nx;
                        const dy = currentSubset[a].ny - currentSubset[b].ny;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > maxDist) maxDist = dist;
                    }
                }
                if (maxDist < minSpread) {
                    minSpread = maxDist;
                    bestSubset = [...currentSubset];
                }
                return;
            }
            for (let i = idx; i < n; i++) {
                currentSubset.push(workingSet[i]);
                getCombinations(i + 1, currentSubset);
                currentSubset.pop();
            }
        }

        getCombinations(0, []);
        return bestSubset.length === 5 ? { minSpread, bestSubset } : null;
    }

    // Unified target canvas initialization with mirroring
    function initTargetCanvases(desktopId, mobileId, type, clearBtnId) {
        const dCanvas = document.getElementById(desktopId);
        const mCanvas = document.getElementById(mobileId);
        if (!dCanvas || !mCanvas) return;

        const dCtx = dCanvas.getContext('2d');
        const mCtx = mCanvas.getContext('2d');
        let shots = [];

        function drawAll() {
            [dCanvas, mCanvas].forEach(canvas => {
                const ctx = canvas.getContext('2d');
                const { width, height } = canvas;
                const centerX = width / 2;
                const centerY = height / 2;

                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;

                [0.2, 0.4, 0.6, 0.8].forEach(scale => {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, (width / 2) * scale, 0, Math.PI * 2);
                    ctx.stroke();
                });

                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
                ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
                ctx.stroke();

                ctx.fillStyle = '#000';
                for (let i = 1; i < 5; i++) {
                    const offset = (width / 2) * (i * 0.2);
                    ctx.beginPath(); ctx.arc(centerX + offset, centerY, 2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(centerX - offset, centerY, 2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(centerX, centerY + offset, 2, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(centerX, centerY - offset, 2, 0, Math.PI * 2); ctx.fill();
                }

                if (type === 'shot') {
                    ctx.fillStyle = '#22c55e';
                    ctx.beginPath(); ctx.arc(centerX, centerY, 4, 0, Math.PI * 2); ctx.fill();
                }

                shots.forEach((shot, index) => {
                    const x = shot.nx * width;
                    const y = shot.ny * height;
                    
                    if (index === 0 && type === 'shot') {
                        // COLD BORE SHOT (Shot #1) in Blue
                        ctx.fillStyle = '#3b82f6';
                        ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
                    } else {
                        // Standard Shots in Theme Red
                        ctx.fillStyle = '#ef4444';
                        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
                    }

                    // Number above shot
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 8px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(index + 1, x, y - 6);
                });

                // TIGHTEST 5-SHOT GROUP ANALYZER & OVERLAY
                if (type === 'shot' && shots.length >= 5) {
                    const metrics = calculateGroupMetrics(shots);
                    if (metrics) {
                        const moa = (metrics.minSpread * 10).toFixed(2);
                        let gradeText = '🥉 C-CLASS RECRUIT';
                        if (moa < 0.5) gradeText = '👑 S-CLASS SNIPER';
                        else if (moa < 1.0) gradeText = '🥇 A-CLASS EXPERT';
                        else if (moa < 1.5) gradeText = '🥈 B-CLASS MARKSMAN';

                        // Draw best 5-shot subset connect lines (subtle overlay)
                        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([2, 2]);
                        ctx.beginPath();
                        metrics.bestSubset.forEach((pt, i) => {
                            const px = pt.nx * width;
                            const py = pt.ny * height;
                            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                        });
                        ctx.closePath();
                        ctx.stroke();
                        ctx.setLineDash([]); // Reset line dash

                        // Update HUD display
                        const moaEl = document.getElementById('best-group-moa');
                        const gradeEl = document.getElementById('shooter-grade');
                        const hudEl = document.getElementById('shot-metrics-hud');
                        if (moaEl) moaEl.textContent = moa;
                        if (gradeEl) {
                            gradeEl.textContent = gradeText;
                        }
                        if (hudEl) hudEl.classList.remove('hidden');
                    }
                } else if (type === 'shot') {
                    const hudEl = document.getElementById('shot-metrics-hud');
                    if (hudEl) hudEl.classList.add('hidden');
                }
            });
        }

        const handlePointer = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width;
            const ny = (e.clientY - rect.top) / rect.height;

            if (e.button === 2) {
                shots.pop();
            } else if (shots.length < 20) {
                shots.push({ nx, ny });
            }
            drawAll();
        };

        [dCanvas, mCanvas].forEach(canvas => {
            canvas.getShots = () => shots;
            canvas.setShots = (newShots) => { shots = newShots; drawAll(); };
            canvas.addEventListener('click', handlePointer);
            canvas.addEventListener('contextmenu', e => e.preventDefault());
        });

        if (clearBtnId) {
            const clearBtn = document.getElementById(clearBtnId);
            if (clearBtn) clearBtn.addEventListener('click', () => { shots = []; drawAll(); });
        }
        drawAll();
    }

    initTargetCanvases('canvas-hold', 'mobile-canvas-hold', 'hold', 'clear-hold-btn');
    initTargetCanvases('canvas-shot', 'mobile-canvas-shot', 'shot', 'clear-shot-btn');

    // === 4. Profile Management & Library ===
    const profileSelect = document.getElementById('profileSelect');
    const saveProfileBtn = document.getElementById('saveProfileBtnManual');
    const deleteProfileBtn = document.getElementById('deleteProfileBtn');

    window.deleteRangeProfile = async function(name) {
        if (!name) return;
        if (!confirm(`PERMANENTLY DELETE "${name.toUpperCase()}" FROM SECURE CACHE?`)) return;

        try {
            // 1. Remove from memory cache
            if (window.loadedProfilesCache) delete window.loadedProfilesCache[name];
            
            // 2. Remove from IndexedDB
            if (window.TRC_IDB) {
                await window.TRC_IDB.delete('rangeCardProfiles', name);
            } else {
                // Fallback for manual deletion from LS
                const ps = JSON.parse(localStorage.getItem('rangeCardProfiles') || '{}');
                delete ps[name];
                localStorage.setItem('rangeCardProfiles', JSON.stringify(ps));
            }

            // 3. Visual sync
            if (window.updateProfileList) window.updateProfileList();
            if (window.refreshSatArchiveGrid) window.refreshSatArchiveGrid();

            // Reset preview states if deleted item was being viewed
            const prevName = document.getElementById('previewName');
            if (prevName && prevName.textContent === name) {
                document.getElementById('profilePreview').classList.add('hidden');
                document.getElementById('noSelection').classList.remove('hidden');
            }

            // alert("Successfully Expunged.");
        } catch (err) {
            console.error("Failed to delete profile:", err);
            alert("CRITICAL: Failed to erase cache entry.");
        }
    };

    // Wire up zombie global button!
    if (deleteProfileBtn) {
        deleteProfileBtn.onclick = () => {
            const target = document.getElementById('previewName')?.textContent;
            if(target) window.deleteRangeProfile(target);
        };
    }
    const clearFormBtn = document.getElementById('clearFormBtn');
    const libraryModal = document.getElementById('libraryModal');
    const libraryList = document.getElementById('libraryList');
    const openLibraryBtn = document.getElementById('openLibraryBtn');
    const closeLibraryBtn = document.getElementById('closeLibraryBtn');

    if (clearFormBtn) {
        clearFormBtn.onclick = () => {
            if (confirm("Clear all tactical data and start fresh? This cannot be undone.")) {
                // Reset text inputs
                inputs.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        // Keep the default distance values
                        if (id.startsWith('dist-')) {
                            // do nothing to the distance labels themselves (100, 200, etc)
                        } else {
                            el.value = '';
                            el.dispatchEvent(new Event('input'));
                        }
                    }
                });

                // Reset specific defaults
                if (dateInput) {
                    dateInput.valueAsDate = new Date();
                    dateInput.dispatchEvent(new Event('input'));
                }

                // Clear Canvases by triggering clicks on existing clear buttons
                ['clear-hold-btn', 'clear-shot-btn', 'clear-pencil', 'clear-grade'].forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) btn.click();
                });

                // Reset Calculator
                if (window.clearCalc) window.clearCalc();

                // Clear Compass lines (manually trigger redraw)
                if (window.drawCompassVector) window.drawCompassVector();

                // === EXTENDED CLEAR: RECON MAPPER ===
                // Clear Inputs & trigger displays
                const recName = document.getElementById('recon-scenario-name');
                const recRep = document.getElementById('recon-report');
                if (recName) { recName.value = ''; recName.dispatchEvent(new Event('input')); }
                if (recRep) { recRep.value = ''; recRep.dispatchEvent(new Event('input')); }

                // Remove map markers
                document.querySelectorAll('.recon-marker').forEach(m => m.remove());

                // Clear drawing canvases
                ['clear-recon-drawings', 'clear-recon-pencil'].forEach(id => {
                    const b = document.getElementById(id);
                    if (b) b.click();
                });

                // Reset Map background to default grid
                const recBg = document.getElementById('recon-bg-image');
                const recGrid = document.getElementById('recon-default-grid');
                const mobBg = document.getElementById('mobile-recon-bg-image');
                const mobGrid = document.getElementById('mobile-recon-default-grid');
                const recUpload = document.getElementById('map-bg-upload');

                if (recBg) { recBg.src = ''; recBg.classList.add('hidden'); }
                if (recGrid) recGrid.classList.remove('hidden');
                if (mobBg) { mobBg.src = ''; mobBg.classList.add('hidden'); }
                if (mobGrid) mobGrid.classList.remove('hidden');
                if (recUpload) recUpload.value = '';

                alert("Tactical data cleared.");
            }
        };
    }

    window.loadedProfilesCache = {};
    window.currentLibraryFilter = 'all';

    window.getProfiles = function() { return window.loadedProfilesCache || {}; };

    if (window.TRC_IDB) {
        window.TRC_IDB.migrateFromLocalStorage().then(() => {
            return window.TRC_IDB.getAll('rangeCardProfiles');
        }).then(profiles => {
            window.loadedProfilesCache = profiles || {};
            if (window.updateProfileList) window.updateProfileList();
        }).catch(err => {
            console.error("IDB load failed, falling back to localStorage:", err);
            window.loadedProfilesCache = JSON.parse(localStorage.getItem('rangeCardProfiles') || '{}');
            if (window.updateProfileList) window.updateProfileList();
        });
    } else {
        window.loadedProfilesCache = JSON.parse(localStorage.getItem('rangeCardProfiles') || '{}');
    }

    window.updateProfileList = function() {
        const ps = getProfiles();
        // Update hidden select
        profileSelect.innerHTML = '<option value="">Select a profile...</option>';
        // Update Library List
        if (libraryList) libraryList.innerHTML = '';

        let names = Object.keys(ps).sort().reverse();
        if (window.currentLibraryFilter === 'zero') {
            names = names.filter(name => !ps[name].isReconScenario);
        } else if (window.currentLibraryFilter === 'recon') {
            names = names.filter(name => !!ps[name].isReconScenario);
        }
        names.forEach((name, index) => {
            // Dropdown
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = name;
            profileSelect.appendChild(opt);

            // Library Item
            if (libraryList) {
                const item = document.createElement('div');
                item.className = "p-4 bg-gray-800/30 hover:bg-neon-green/10 rounded-lg border border-gray-800 hover:border-neon-green/40 cursor-pointer transition-all group";
                item.innerHTML = `
                    <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0 flex items-center gap-3">
                            <span class="text-[9px] font-mono text-neon-green opacity-40">${names.length - index}.</span>
                            <div class="min-w-0">
                                <div class="font-bold text-sm text-gray-200 truncate pr-4 group-hover:text-white">${name}</div>
                                <div class="text-[9px] text-gray-400 font-mono uppercase mt-1">
                                    ${ps[name].isReconScenario ? '🗺️ RECON SITREP' : (ps[name].caliber || 'No Caliber')} • ${ps[name].isReconScenario ? (ps[name].timestamp ? new Date(ps[name].timestamp).toLocaleDateString() : '--') : (ps[name].date || '--')}
                                </div>
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-700 group-hover:text-neon-green"></i>
                    </div>
                `;
                item.onclick = () => previewProfile(name);
                libraryList.appendChild(item);
            }
        });
        if (window.lucide) lucide.createIcons();
    }

    window.previewProfile = function(name) {
        const ps = getProfiles();
        const data = ps[name];
        if (!data) return;

        const emptyState = document.getElementById('noSelection');
        if (emptyState) emptyState.classList.add('hidden');

        document.getElementById('profilePreview').classList.remove('hidden');
        document.getElementById('previewName').textContent = name;
        
        if (data.isReconScenario) {
            document.getElementById('previewCaliber').textContent = `🗺️ RECON SCENARIO SITREP`;
            document.getElementById('prevDate').textContent = data.timestamp ? new Date(data.timestamp).toLocaleDateString() : '--';
        } else {
            document.getElementById('previewCaliber').textContent = `${data.caliber || '---'} • ${data.bullet || '---'}`;
            document.getElementById('prevDate').textContent = data.date || '--';
        }

        // Populate Snapshot
        const img = document.getElementById('prevImage');
        const noImg = document.getElementById('noImageMsg');
        if (data.snapshot) {
            img.src = data.snapshot;
            img.classList.remove('hidden');
            noImg.classList.add('hidden');
        } else {
            img.src = "";
            img.classList.add('hidden');
            noImg.classList.remove('hidden');
        }

        // Expanded Data Fields
        document.getElementById('prevVel').textContent = data.velocity || '--';
        document.getElementById('prevZero').textContent = data.zero || '--';
        document.getElementById('prevBarrel').textContent = data.barrel || '--';
        document.getElementById('prevPowder').textContent = data.powder || '--';
        document.getElementById('prevLoad').textContent = data.load || '--';
        document.getElementById('prevCOL').textContent = data.col || '--';
        document.getElementById('prevRings').textContent = data.rings || '--';
        document.getElementById('prevG1').textContent = data.g1 || '--';
        document.getElementById('prevHeaderNotes').textContent = data['header-notes'] || '--';
        document.getElementById('prevShooter').textContent = data['shooter-name'] || '--';
        document.getElementById('prevTime').textContent = data.time || '--';
        document.getElementById('prevElev').textContent = data.elevation || '--';
        document.getElementById('prevHold').textContent = data['hold-data'] || '--';
        document.getElementById('prevFinal').textContent = data['final-dope'] || '--';
        document.getElementById('prevWeather').textContent = data.weather || '--';
        document.getElementById('prevRifleNotes').textContent = data['rifle-notes'] || '--';

        // Distance Table (100-1000)
        const dTable = document.getElementById('prevDistanceTable');
        if (dTable) {
            dTable.innerHTML = '';
            [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].forEach(d => {
                const clicks = data[`clicks-${d}`] || '--';
                const udlr = data[`udlr-${d}`] || '--';
                const row = document.createElement('div');
                row.className = "p-2 bg-black/60 border border-gray-800 rounded-lg flex flex-col items-center justify-center transition-all hover:border-neon-green/30";
                row.innerHTML = `
                    <span class="text-[7px] text-gray-500 font-bold uppercase tracking-tighter">${d}Y</span>
                    <span class="text-[11px] text-neon-green font-black leading-tight">${clicks}</span>
                    <span class="text-[7px] text-blue-400/70 font-bold uppercase">${udlr}</span>
                `;
                dTable.appendChild(row);
            });
        }

        // Toggle View Logic
        const viewDataBtn = document.getElementById('viewDataBtn');
        const viewImageBtn = document.getElementById('viewImageBtn');
        const dataView = document.getElementById('dataPreview');
        const imgView = document.getElementById('snapshotPreview');

        const activeClass = "bg-neon-green text-black";
        const inactiveClass = "text-gray-400 hover:text-white";

        viewDataBtn.onclick = () => {
            dataView.classList.remove('hidden');
            imgView.classList.add('hidden');
            viewDataBtn.className = `px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${activeClass}`;
            viewImageBtn.className = `px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${inactiveClass}`;
        };

        viewImageBtn.onclick = () => {
            dataView.classList.add('hidden');
            imgView.classList.remove('hidden');
            viewImageBtn.className = `px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${activeClass}`;
            viewDataBtn.className = `px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${inactiveClass}`;
        };

        // Default to Image (Visual) view as requested
        viewImageBtn.click();

        // Actions
        document.getElementById('loadSelectedBtn').onclick = () => {
            loadProfile(name);
            window.closeLibrary();
        };
        document.getElementById('injectReconBtn').onclick = () => {
            const ps = getProfiles();
            const data = ps[name];
            if (!data) return;

            const toggleBtn = document.getElementById('toggleReconMapperBtn');
            const isCurrentlyActive = toggleBtn && toggleBtn.textContent.includes('BACK TO RANGE CARD');
            if (!isCurrentlyActive && toggleBtn) {
                toggleBtn.click();
            }

            const rScenarioInput = document.getElementById('recon-scenario-name');
            const rReportInput = document.getElementById('recon-report');
            if (rScenarioInput) { rScenarioInput.value = data.name || ''; rScenarioInput.dispatchEvent(new Event('input')); }
            if (rReportInput) { rReportInput.value = data.report || ''; rReportInput.dispatchEvent(new Event('input')); }

            const rBgImage = document.getElementById('recon-bg-image');
            const mBgImage = document.getElementById('mobile-recon-bg-image');
            const rDefaultGrid = document.getElementById('recon-default-grid');
            const mDefaultGrid = document.getElementById('mobile-recon-default-grid');

            if (rBgImage) {
                const mapSrc = data.snapshot || data.bgImage || data.image;
                if (mapSrc) {
                    rBgImage.src = mapSrc;
                    rBgImage.classList.remove('hidden');
                    if (rDefaultGrid) rDefaultGrid.classList.add('hidden');
                    if (mBgImage) { mBgImage.src = mapSrc; mBgImage.classList.remove('hidden'); }
                    if (mDefaultGrid) mDefaultGrid.classList.add('hidden');
                } else {
                    rBgImage.classList.add('hidden'); rBgImage.src = '';
                    if (rDefaultGrid) rDefaultGrid.classList.remove('hidden');
                    if (mBgImage) { mBgImage.classList.add('hidden'); mBgImage.src = ''; }
                    if (mDefaultGrid) mDefaultGrid.classList.remove('hidden');
                }
            }

            document.querySelectorAll('.recon-marker').forEach(m => m.remove());
            if (data.markers && Array.isArray(data.markers)) {
                data.markers.forEach(m => {
                    if (typeof window.createMarker === 'function') {
                        window.createMarker(m.x, m.y, m.emoji, m.note || '');
                    }
                });
            }

            const rCanvas = document.getElementById('recon-canvas');
            const mCanvas = document.getElementById('mobile-recon-canvas');
            if (rCanvas) {
                const rCtx = rCanvas.getContext('2d');
                rCtx.clearRect(0, 0, rCanvas.width, rCanvas.height);
                if (mCanvas) mCanvas.getContext('2d').clearRect(0, 0, mCanvas.width, mCanvas.height);
                
                if (data.drawing) {
                    const img = new Image();
                    img.onload = () => {
                        rCtx.drawImage(img, 0, 0);
                        if (mCanvas) mCanvas.getContext('2d').drawImage(img, 0, 0);
                    };
                    img.src = data.drawing;
                }
            }

            window.closeLibrary();
        };
        document.getElementById('deleteSelectedBtn').onclick = () => {
            if (confirm(`Trash record "${name}"?`)) {
                const ps_new = getProfiles();
                delete ps_new[name];
                if (window.TRC_IDB) {
                    window.TRC_IDB.delete('rangeCardProfiles', name).then(() => {
                        updateProfileList();
                        resetPreview();
                    }).catch(err => {
                        console.error("IDB delete failed:", err);
                        updateProfileList();
                        resetPreview();
                    });
                } else {
                    localStorage.setItem('rangeCardProfiles', JSON.stringify(ps_new));
                    updateProfileList();
                    resetPreview();
                }
            }
        };
    }

    function resetPreview() {
        document.getElementById('profilePreview').classList.add('hidden');
        const emptyState = document.getElementById('noSelection');
        if (emptyState) emptyState.classList.remove('hidden');
    }

    function loadProfile(name) {
        const ps = getProfiles();
        const data = ps[name];
        if (!data) return;

        if (data.isReconScenario) {
            const toggleBtn = document.getElementById('toggleReconMapperBtn');
            const isCurrentlyActive = toggleBtn && toggleBtn.textContent.includes('BACK TO RANGE CARD');
            if (!isCurrentlyActive && toggleBtn) {
                toggleBtn.click();
            }

            const rScenarioInput = document.getElementById('recon-scenario-name');
            const rReportInput = document.getElementById('recon-report');
            
            if (rScenarioInput) {
                rScenarioInput.value = data.name || '';
                rScenarioInput.dispatchEvent(new Event('input'));
            }
            if (rReportInput) {
                rReportInput.value = data.report || '';
                rReportInput.dispatchEvent(new Event('input'));
            }

            const rBgImage = document.getElementById('recon-bg-image');
            const rDefaultGrid = document.getElementById('recon-default-grid');
            const mBgImage = document.getElementById('mobile-recon-bg-image');
            const mDefaultGrid = document.getElementById('mobile-recon-default-grid');

            if (rBgImage) {
                if (data.bgImage) {
                    rBgImage.src = data.bgImage;
                    rBgImage.classList.remove('hidden');
                    if (rDefaultGrid) rDefaultGrid.classList.add('hidden');
                    if (mBgImage) {
                        mBgImage.src = data.bgImage;
                        mBgImage.classList.remove('hidden');
                    }
                    if (mDefaultGrid) mDefaultGrid.classList.add('hidden');
                } else {
                    rBgImage.classList.add('hidden');
                    rBgImage.src = '';
                    if (rDefaultGrid) rDefaultGrid.classList.remove('hidden');
                    if (mBgImage) {
                        mBgImage.classList.add('hidden');
                        mBgImage.src = '';
                    }
                    if (mDefaultGrid) mDefaultGrid.classList.remove('hidden');
                }
            }

            document.querySelectorAll('.recon-marker').forEach(m => m.remove());
            if (data.markers && Array.isArray(data.markers)) {
                data.markers.forEach(m => {
                    if (typeof window.createMarker === 'function') {
                        window.createMarker(m.x, m.y, m.emoji, m.note || '');
                    }
                });
            }

            const rCanvas = document.getElementById('recon-canvas');
            const mCanvas = document.getElementById('mobile-recon-canvas');

            if (rCanvas) {
                const rCtx = rCanvas.getContext('2d');
                const mCtx = mCanvas ? mCanvas.getContext('2d') : null;
                rCtx.clearRect(0, 0, rCanvas.width, rCanvas.height);
                if (mCtx) mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
                if (data.drawing) {
                    const img = new Image();
                    img.onload = () => {
                        rCtx.drawImage(img, 0, 0);
                        if (mCtx) mCtx.drawImage(img, 0, 0);
                    };
                    img.src = data.drawing;
                }
            }
            return;
        }

        const toggleBtn = document.getElementById('toggleReconMapperBtn');
        const isCurrentlyActive = toggleBtn && toggleBtn.textContent.includes('BACK TO RANGE CARD');
        if (isCurrentlyActive && toggleBtn) {
            toggleBtn.click();
        }
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = data[id] || '';
                el.dispatchEvent(new Event('input'));
            }
        });
        profileSelect.value = name;

        // Restore interactive clicked coordinates and redraw them instantly!
        const canvasShot = document.getElementById('canvas-shot');
        const canvasHold = document.getElementById('canvas-hold');
        if (canvasShot && canvasShot.setShots) canvasShot.setShots(data.shotPoints || []);
        if (canvasHold && canvasHold.setShots) canvasHold.setShots(data.holdPoints || []);

        // Restore pencil and grade drawings onto both desktop and mobile canvases
        ['pencil-canvas', 'mobile-pencil-canvas'].forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (data.pencilDrawing) {
                    const img = new Image();
                    img.onload = () => ctx.drawImage(img, 0, 0);
                    img.src = data.pencilDrawing;
                }
            }
        });
        ['grade-canvas', 'mobile-grade-canvas'].forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (data.gradeDrawing) {
                    const img = new Image();
                    img.onload = () => ctx.drawImage(img, 0, 0);
                    img.src = data.gradeDrawing;
                }
            }
        });
    }

    window.openLibrary = function() {
        libraryModal.classList.remove('hidden');
        const modalTitle = document.getElementById('libraryModalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'TACTICAL DATA REPOSITORY';
        }
        window.updateProfileList();
        resetPreview();
    };
    window.closeLibrary = function() { libraryModal.classList.add('hidden'); };

    openLibraryBtn.onclick = () => {
        window.currentLibraryFilter = 'all';
        window.openLibrary();
    };
    closeLibraryBtn.onclick = window.closeLibrary;

    saveProfileBtn.onclick = () => {
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
                    window.TRC_IDB.set('rangeCardProfiles', name, data).then(() => {
                        postSave();
                    }).catch(err => {
                        console.error("IDB save failed, falling back to localStorage:", err);
                        localStorage.setItem('rangeCardProfiles', JSON.stringify(ps));
                        postSave();
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

    updateProfileList();
    // === 5. Compass Vector Visualization ===
    const compassCanvas = document.getElementById('compass-vector');
    const mobileCompassCanvas = document.getElementById('mobile-compass-vector'); // NEW

    const targetConfigs = [
        { angleId: 'shooting-angle', rangeId: 'compass-range' }
    ];

    window.drawCompassVector = function () {
        [compassCanvas, mobileCompassCanvas].forEach(canvas => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const { width, height } = canvas;
            const centerX = width / 2, centerY = height / 2;
            ctx.clearRect(0, 0, width, height);

            const maxRadius = (Math.min(width, height) / 2) - 15;

            targetConfigs.forEach((config, index) => {
                const ai = document.getElementById(config.angleId);
                const ri = document.getElementById(config.rangeId);
                if (!ai || !ri) return;

                // Parse Angle
                let ang = parseFloat(ai.value);
                if (isNaN(ang)) {
                    const m = ai.value.match(/\d+/);
                    if (m) ang = parseFloat(m[0]);
                }
                if (isNaN(ang)) return;

                // Parse Range for Scaling (0 - 1000 yds)
                let rangeVal = 0;
                const rangeMatch = ri.value.match(/\d+/);
                if (rangeMatch) rangeVal = parseFloat(rangeMatch[0]);

                // Calculate Radius based on range (Min 15% for visibility, Max 100%)
                const scaleFactor = Math.min(Math.max(rangeVal / 1000, 0.15), 1.0);
                const currentRadius = maxRadius * scaleFactor;

                const rads = (ang - 90) * (Math.PI / 180);
                const ex = centerX + currentRadius * Math.cos(rads);
                const ey = centerY + currentRadius * Math.sin(rads);

                // Draw Dotted Line
                ctx.beginPath();
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(ex, ey);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw X Marker
                const xs = 5;
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#000';
                ctx.beginPath();
                ctx.moveTo(ex - xs, ey - xs); ctx.lineTo(ex + xs, ey + xs);
                ctx.moveTo(ex + xs, ey - xs); ctx.lineTo(ex - xs, ey + xs);
                ctx.stroke();

                // Draw Label
                const txt = ri.value;
                if (txt) {
                    ctx.font = 'bold 8px Inter, sans-serif';
                    ctx.textBaseline = 'middle';

                    // Base positioning relative to X marker (index 0 is T1, index 1 is Location/T2)
                    let baseAlign = (index === 1) ? 'left' : 'right';
                    let labelX = (index === 1) ? ex + 10 : ex - 10;
                    let labelY = ey;

                    // Small vertical stagger to prevent overlap if angles are identical
                    if (index === 0) labelY -= 8;

                    // Measure text to draw a small background for legibility
                    const metrics = ctx.measureText(txt);
                    const padding = 2;
                    const bgWidth = metrics.width + (padding * 2);
                    const bgHeight = 10;

                    // Calculate initial background left (X) coordinate based on alignment
                    let bgX = labelX;
                    if (baseAlign === 'right') bgX -= metrics.width;
                    let bgY = labelY - 5;

                    // BULLETPROOF BOUNDARY CLAMPING: Prevent text/background from running off the canvas
                    bgX = Math.max(12, Math.min(bgX, width - bgWidth - 12));
                    bgY = Math.max(12, Math.min(bgY, height - bgHeight - 12));

                    // Draw background rectangle
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

                    // Draw the text perfectly aligned inside the clamped background
                    ctx.textAlign = 'left';
                    ctx.fillStyle = '#1e3a8a';
                    ctx.fillText(txt, bgX + padding, bgY + 5);
                }
            });
        });
    }

    targetConfigs.forEach(c => {
        [c.angleId, c.rangeId].forEach(id => {
            const el = document.getElementById(id);
            if (el) ['input', 'change', 'blur'].forEach(ev => el.addEventListener(ev, window.drawCompassVector));
        });
    });
    setTimeout(window.drawCompassVector, 500);

    // === 6. Pencil Tool ===
    const canvases = [
        document.getElementById('pencil-canvas'),
        document.getElementById('mobile-pencil-canvas')
    ].filter(canvas => canvas !== null);

    const pencilToggle = document.getElementById('pencil-toggle');

    if (canvases.length > 0 && pencilToggle) {
        const contexts = canvases.map(c => c.getContext('2d'));
        let drawing = false;

        pencilToggle.addEventListener('change', (e) => {
            canvases.forEach(canvas => {
                canvas.classList.toggle('pointer-events-none', !e.target.checked);
                canvas.style.cursor = e.target.checked ? 'crosshair' : 'default';
            });
        });

        const getNormalizedPos = (e, canvas) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                nx: (clientX - rect.left) / rect.width,
                ny: (clientY - rect.top) / rect.height
            };
        };

        const start = (e) => {
            if (!pencilToggle.checked) return;
            // Prevent default to stop scrolling IF drawing
            if (e.type === 'touchstart' && e.cancelable) e.preventDefault();

            drawing = true;
            // SYNC: Get normalized position from the surface being touched
            const { nx, ny } = getNormalizedPos(e, e.currentTarget);

            canvases.forEach((canvas, idx) => {
                const pCtx = contexts[idx];
                pCtx.beginPath();
                pCtx.lineWidth = 1.0;
                pCtx.lineCap = 'round';
                pCtx.strokeStyle = '#6b7280';

                // Scale normalized pos to THIS canvas's dimensions
                pCtx.moveTo(nx * canvas.width, ny * canvas.height);
            });
        };

        const move = (e) => {
            if (!drawing) return;
            if (e.type === 'touchmove' && e.cancelable) e.preventDefault();

            const { nx, ny } = getNormalizedPos(e, e.currentTarget);

            // SYNC: Draw on ALL canvases
            canvases.forEach((canvas, idx) => {
                const pCtx = contexts[idx];
                pCtx.lineTo(nx * canvas.width, ny * canvas.height);
                pCtx.stroke();
            });
        };

        const stop = () => {
            if (!drawing) return;
            // SYNC: Finish path on all canvases
            contexts.forEach(ctx => ctx.closePath());
            drawing = false;
        };

        canvases.forEach(canvas => {
            ['mousedown', 'touchstart'].forEach(ev => canvas.addEventListener(ev, start, { passive: false }));
            ['mousemove', 'touchmove'].forEach(ev => canvas.addEventListener(ev, move, { passive: false }));
            ['mouseup', 'mouseleave', 'touchend'].forEach(ev => canvas.addEventListener(ev, stop, { passive: false }));
        });

        document.getElementById('clear-pencil').addEventListener('click', () => {
            if (confirm('Clear all drawings?')) {
                contexts.forEach((pCtx, i) => {
                    pCtx.clearRect(0, 0, canvases[i].width, canvases[i].height);
                });
            }
        });
    }

    // === 6b. Grade Tool ===
    const gradeCanvases = [
        document.getElementById('grade-canvas'),
        document.getElementById('mobile-grade-canvas')
    ].filter(canvas => canvas !== null);

    const gradeToggle = document.getElementById('grade-toggle');

    if (gradeCanvases.length > 0 && gradeToggle) {
        const gradeContexts = gradeCanvases.map(c => c.getContext('2d'));
        let gradeDrawing = false;

        // Mutual exclusion: Checking Grade Tool unchecks Pencil Tool
        gradeToggle.addEventListener('change', (e) => {
            if (e.target.checked && pencilToggle) {
                pencilToggle.checked = false;
                pencilToggle.dispatchEvent(new Event('change'));
            }
            gradeCanvases.forEach(canvas => {
                canvas.classList.toggle('pointer-events-none', !e.target.checked);
                canvas.style.cursor = e.target.checked ? 'crosshair' : 'default';
            });
        });

        // Mutual exclusion: Checking Pencil Tool unchecks Grade Tool
        if (pencilToggle) {
            pencilToggle.addEventListener('change', (e) => {
                if (e.target.checked && gradeToggle) {
                    gradeToggle.checked = false;
                    gradeToggle.dispatchEvent(new Event('change'));
                }
            });
        }

        const getNormalizedPos = (e, canvas) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                nx: (clientX - rect.left) / rect.width,
                ny: (clientY - rect.top) / rect.height
            };
        };

        const startGrade = (e) => {
            if (!gradeToggle.checked) return;
            if (e.type === 'touchstart' && e.cancelable) e.preventDefault();

            gradeDrawing = true;
            const { nx, ny } = getNormalizedPos(e, e.currentTarget);

            gradeCanvases.forEach((canvas, idx) => {
                const gCtx = gradeContexts[idx];
                gCtx.beginPath();
                gCtx.lineWidth = 1.0;
                gCtx.lineCap = 'round';
                gCtx.strokeStyle = '#ef4444'; // Red color

                gCtx.moveTo(nx * canvas.width, ny * canvas.height);
            });
        };

        const moveGrade = (e) => {
            if (!gradeDrawing) return;
            if (e.type === 'touchmove' && e.cancelable) e.preventDefault();

            const { nx, ny } = getNormalizedPos(e, e.currentTarget);

            gradeCanvases.forEach((canvas, idx) => {
                const gCtx = gradeContexts[idx];
                gCtx.lineTo(nx * canvas.width, ny * canvas.height);
                gCtx.stroke();
            });
        };

        const stopGrade = () => {
            if (!gradeDrawing) return;
            gradeContexts.forEach(ctx => ctx.closePath());
            gradeDrawing = false;
        };

        gradeCanvases.forEach(canvas => {
            ['mousedown', 'touchstart'].forEach(ev => canvas.addEventListener(ev, startGrade, { passive: false }));
            ['mousemove', 'touchmove'].forEach(ev => canvas.addEventListener(ev, moveGrade, { passive: false }));
            ['mouseup', 'mouseleave', 'touchend'].forEach(ev => canvas.addEventListener(ev, stopGrade, { passive: false }));
        });

        document.getElementById('clear-grade').addEventListener('click', () => {
            if (confirm('Clear all grade drawings?')) {
                gradeContexts.forEach((gCtx, i) => {
                    gCtx.clearRect(0, 0, gradeCanvases[i].width, gradeCanvases[i].height);
                });
            }
        });
    }

    document.getElementById('downloadBtn').addEventListener('click', () => {
        const isReconActive = !document.getElementById('recon-card-container').classList.contains('hidden');
        
        // Restore workspace to desktop for correct capture
        if (isReconActive && typeof restoreWorkspaceToDesktop === 'function') {
            restoreWorkspaceToDesktop();
        }

        const container = isReconActive ? document.getElementById('recon-card-container') : document.getElementById('card-container');
        const previewPanel = document.getElementById('previewPanel');

        const originalTransform = container.style.transform;
        const originalScrollY = window.scrollY;
        const isVisuallyHidden = previewPanel.classList.contains('opacity-0');

        // PRE-CAPTURE NORMALIZATION
        if (isVisuallyHidden) {
            previewPanel.classList.remove('opacity-0', 'pointer-events-none', 'absolute');
            previewPanel.classList.add('flex');
        }

        const originalTransition = previewPanel.style.transition;
        previewPanel.style.transition = 'none';

        // INDUSTRIAL FIX: Force fixed capture context
        document.body.classList.add('is-capturing');

        window.scrollTo(0, 0);

       /* setTimeout(() => {
            html2canvas(container, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1000,
                windowHeight: 750
            })*/setTimeout(() => {
            // FIX: Force Lucide icons to draw before the "camera" clicks
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // NEW CODE STARTS HERE
            html2canvas(container, {
                scale: 3,             // Higher resolution for clearer text
                backgroundColor: '#ffffff',
                useCORS: true,        // Critical for CDN icons
                allowTaint: false,    // Security handshake
                logging: true,        // Prints errors to F12 Console
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1000,
                windowHeight: 750,
                onclone: (clonedDoc) => {
                    // This forces the "X" and "Pencil" to be visible in the capture
                    const icons = clonedDoc.querySelectorAll('[data-lucide]');
                    icons.forEach(icon => icon.style.visibility = 'visible');
                }
            }).then(canvas => {
                // Restore context
                document.body.classList.remove('is-capturing');
                previewPanel.style.transition = originalTransition;

                // Restore view
                if (isVisuallyHidden) {
                    previewPanel.classList.add('opacity-0', 'pointer-events-none', 'absolute');
                    previewPanel.classList.remove('flex');
                }
                container.style.transform = originalTransform;
                window.scrollTo(0, originalScrollY);

                // Portal back to mobile if active
                if (isReconActive && typeof syncReconPortal === 'function') {
                    syncReconPortal();
                }

                const link = document.createElement('a');
                link.download = `RangeCard-${document.getElementById('date').value || 'export'}.png`;
                link.href = canvas.toDataURL("image/png");

                // For mobile/WebView compatibility
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }).catch(err => {
                document.body.classList.remove('is-capturing');
                previewPanel.style.transition = originalTransition;
                if (isVisuallyHidden) {
                    previewPanel.classList.add('opacity-0', 'pointer-events-none', 'absolute');
                    previewPanel.classList.remove('flex');
                }
                container.style.transform = originalTransform;
                window.scrollTo(0, originalScrollY);

                // Portal back to mobile if active
                if (isReconActive && typeof syncReconPortal === 'function') {
                    syncReconPortal();
                }

                console.error("Download capture failure:", err);
                alert("Download failed. See console.");
            });
        }, 500);
    });

    // === 8. Mobile Responsiveness & View Toggle ===
    const mobileViewToggle = document.getElementById('mobileViewToggle');
    // mainLayout and previewPanel are already declared above
    const toggleIcon = document.getElementById('toggleIcon');
    const aside = document.querySelector('aside');

    if (mobileViewToggle) {
        mobileViewToggle.onclick = () => {
            const isShowingPreview = previewPanel.classList.contains('active');
            if (isShowingPreview) {
                // Switch to Inputs
                previewPanel.classList.remove('active');
                aside.classList.remove('hidden');
                toggleIcon.setAttribute('data-lucide', 'eye');
                mobileViewToggle.classList.replace('bg-gray-800', 'bg-neon-green');
                mobileViewToggle.classList.replace('text-neon-green', 'text-black');
            } else {
                // Switch to Preview
                previewPanel.classList.add('active');
                aside.classList.add('hidden');
                toggleIcon.setAttribute('data-lucide', 'settings');
                mobileViewToggle.classList.replace('bg-neon-green', 'bg-gray-800');
                mobileViewToggle.classList.replace('text-black', 'text-neon-green');
            }
            if (window.lucide) lucide.createIcons();
            handleResponsiveScaling();
        };
    }

    // === TACTICAL FLAVOR COLOR CYCLING ===
    const colorCycleBtn = document.getElementById('colorCycleBtn');
    const flavors = [
        { name: "Neon Green", hex: "#22c55e", rgb: "34, 197, 94" },
        { name: "Tactical Amber", hex: "#f59e0b", rgb: "245, 158, 11" },
        { name: "Cyber Cyan", hex: "#06b6d4", rgb: "6, 182, 212" },
        { name: "Combat Red", hex: "#ef4444", rgb: "239, 68, 68" },
        { name: "Phantom Violet", hex: "#8b5cf6", rgb: "139, 92, 246" },
        { name: "Marine Blue", hex: "#3b82f6", rgb: "59, 130, 246" },
        { name: "Stealth Gray", hex: "#94a3b8", rgb: "148, 163, 184" },
        { name: "Desert Sand", hex: "#d97706", rgb: "217, 119, 6" },
        { name: "Plasma Pink", hex: "#ec4899", rgb: "236, 72, 153" },
        { name: "Nuclear Lime", hex: "#84cc16", rgb: "132, 204, 22" },
        // 10 Tactical Camouflage Flavors added by Antigravity
        { name: "MultiCam OCP", hex: "#8c7d55", rgb: "140, 125, 85" },
        { name: "Woodland M81", hex: "#3f5c35", rgb: "63, 92, 53" },
        { name: "Coyote Brown", hex: "#876445", rgb: "135, 100, 69" },
        { name: "Flat Dark Earth (FDE)", hex: "#bfa16f", rgb: "191, 161, 111" },
        { name: "Olive Drab Green (OD)", hex: "#556b2f", rgb: "85, 107, 47" },
        { name: "Tiger Stripe", hex: "#4a5340", rgb: "74, 83, 64" },
        { name: "Urban Digital", hex: "#5a6268", rgb: "90, 98, 104" },
        { name: "Typhon Charcoal", hex: "#343a40", rgb: "52, 58, 64" },
        { name: "Arctic White", hex: "#e9ecef", rgb: "233, 236, 239" },
        { name: "Navy Seal Gray", hex: "#495057", rgb: "73, 80, 87" },
        // Standard White added for basic users who want no colored borders
        { name: "Standard White", hex: "#ffffff", rgb: "255, 255, 255" }
    ];

    function applyFlavor(index) {
        const flavor = flavors[index];
        document.documentElement.style.setProperty('--accent-color', flavor.hex);
        document.documentElement.style.setProperty('--accent-rgb', flavor.rgb);
        
        // High-contrast tab text coloring for white backgrounds
        const tabTextColor = flavor.hex === "#ffffff" ? "#000000" : "#ffffff";
        document.documentElement.style.setProperty('--tab-text-color', tabTextColor);

        // Remove previous flavor classes
        flavors.forEach(f => {
            const classToRemove = `flavor-${f.name.toLowerCase().replace(/\s/g, '-')}`;
            document.body.classList.remove(classToRemove);
        });

        // Add current flavor class
        document.body.classList.add(`flavor-${flavor.name.toLowerCase().replace(/\s/g, '-')}`);

        if (colorCycleBtn) {
            colorCycleBtn.innerHTML = `<i data-lucide="palette" class="w-4 h-4"></i> Flavor: ${flavor.name}`;
            
            // Dynamic theme styling applied by Antigravity
            colorCycleBtn.style.backgroundColor = `rgba(${flavor.rgb}, 0.2)`;
            colorCycleBtn.style.borderColor = flavor.hex;
            colorCycleBtn.style.color = flavor.hex;
            
            // Interactive hover feedback using the selected flavor colors
            colorCycleBtn.onmouseenter = () => {
                colorCycleBtn.style.backgroundColor = `rgba(${flavor.rgb}, 0.4)`;
            };
            colorCycleBtn.onmouseleave = () => {
                colorCycleBtn.style.backgroundColor = `rgba(${flavor.rgb}, 0.2)`;
            };
            
            if (window.lucide) lucide.createIcons();
        }

        localStorage.setItem('tacticalFlavorIndex', index);
        // console.log(`Applied tactical flavor: ${flavor.name}`);
    }

    if (colorCycleBtn) {
        let currentFlavorIndex = parseInt(localStorage.getItem('tacticalFlavorIndex')) || 0;

        // Initial apply
        applyFlavor(currentFlavorIndex);

        colorCycleBtn.onclick = () => {
            currentFlavorIndex = (currentFlavorIndex + 1) % flavors.length;
            applyFlavor(currentFlavorIndex);
        };
    } else {
        // Fallback for startup if button isn't found immediately
        const savedIndex = parseInt(localStorage.getItem('tacticalFlavorIndex')) || 0;
        applyFlavor(savedIndex);
    }

    // === UNIVERSAL AUTO-SAVE SYSTEM ===
    function autoSaveAll() {
        const formData = {};
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.id) {
                formData[input.id] = input.value;
            }
        });
        localStorage.setItem('rangeCardAutoSave', JSON.stringify(formData));
        // console.log("Auto-save completed.");
    }

    function autoLoadAll() {
        const savedData = localStorage.getItem('rangeCardAutoSave');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                
                // --- ONE-TIME STABILIZATION PATCH: PURGE CORRUPT LEGACY KEYS FROM CACHE ---
                if (localStorage.getItem('rc_fix_corrupt_v1') !== 'true') {
                    delete formData['bal-input-mv'];
                    delete formData['bal-input-range'];
                    delete formData['bal-input-wind'];
                    localStorage.setItem('rangeCardAutoSave', JSON.stringify(formData));
                    localStorage.setItem('rc_fix_corrupt_v1', 'true');
                    // console.log("Fixed data corruptions in auto-save cache.");
                }
                Object.keys(formData).forEach(id => {
                    const input = document.getElementById(id);
                    if (input) {
                        input.value = formData[id];
                        input.dispatchEvent(new Event('input'));
                    }
                });
                // console.log("Auto-load completed.");
            } catch (e) {
                console.error("Error loading auto-save data", e);
            }
        }
    }

    // Attach listeners to all inputs
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            autoSaveAll();
        }
    });

    // Run load on startup
    window.addEventListener('load', () => {
        autoLoadAll();
        setTimeout(handleResponsiveScaling, 300);
    });

    // === RESPONSIVE SCALING ===
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // console.log("Resize detected, recalibrating layout...");
            handleResponsiveScaling();
            if (typeof syncReconPortal === 'function') syncReconPortal();
        }, 250);
    });

    function handleResponsiveScaling() {
        const wrapper = document.getElementById('card-scale-wrapper');
        const container = document.getElementById('card-container');
        if (!wrapper || !container) return;

        const targetWidth = 1000;
        const availableWidth = wrapper.offsetWidth - 32;
        let scale = availableWidth / targetWidth;

        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'top left';

        // Adjust wrapper height to accommodate scaled content
        wrapper.style.height = (targetWidth * 0.75 * scale) + 'px';
    }

    // Initial call
    handleResponsiveScaling();
    if (typeof syncReconPortal === 'function') syncReconPortal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTacticalDashboard1);
} else {
    initializeTacticalDashboard1();
}

function toggleSection(id) { document.getElementById(id).classList.toggle('hidden'); }
window.appendCalc = function (v) {
    const d = document.getElementById('calc-display');
    d.value = (d.value === '0' && v !== '.') ? v : d.value + v;
};
window.clearCalc = function () { document.getElementById('calc-display').value = '0'; };
window.executeCalc = function () {
    const d = document.getElementById('calc-display');
    try { d.value = eval(d.value.replace(/[^-0-9+*/.]/g, '')); } catch { d.value = 'Error'; setTimeout(clearCalc, 1000); }
};
window.calcCos = function () {
    const d = document.getElementById('calc-display');
    try { const v = parseFloat(d.value); if (!isNaN(v)) d.value = Math.cos(v * Math.PI / 180).toFixed(4); } catch { d.value = 'Error'; setTimeout(clearCalc, 1000); }
};

// --- Vault Swipe Controller (V1.6 Connected) ---
function initializeTacticalDashboard2() {
    let profileNames = [];
    let currentProfileIndex = -1;

    function refreshProfileNames() {
        if (!window.getProfiles) return;
        const ps = window.getProfiles();
        // Align carousel perfectly with the displayed/filtered list logic
        let names = Object.keys(ps).sort().reverse();
        if (window.currentLibraryFilter === 'zero') {
            names = names.filter(n => !ps[n].isReconScenario);
        } else if (window.currentLibraryFilter === 'recon') {
            names = names.filter(n => !!ps[n].isReconScenario);
        }
        profileNames = names;
    }

    // Hook into the original update logic
    const originalUpdate = window.updateProfileList;
    window.updateProfileList = function() {
        if (originalUpdate) originalUpdate.apply(this, arguments);
        refreshProfileNames();
        updateGalleryStats();
    };

    const originalPreview = window.previewProfile;
    window.previewProfile = function(name) {
        if (originalPreview) originalPreview.apply(this, arguments);
        refreshProfileNames(); 
        currentProfileIndex = profileNames.indexOf(name);
        
        updateGalleryStats();
    };

    function updateGalleryStats() {
        const counter = document.getElementById('galleryCounter');
        if (counter && currentProfileIndex !== -1 && profileNames.length > 0) {
            counter.classList.remove('hidden');
            counter.textContent = `Card ${currentProfileIndex + 1} of ${profileNames.length}`;
        }
    }

    function navigate(dir, event) {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        refreshProfileNames(); 
        if (profileNames.length === 0) return;
        
        // Use the public window function to force the flip
        let nextIndex = currentProfileIndex + dir;
        if (nextIndex >= profileNames.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = profileNames.length - 1;
        
        const nextName = profileNames[nextIndex];
        if (nextName && window.previewProfile) {
            window.previewProfile(nextName);
            if (window.lucide) lucide.createIcons();
        }
    }

    // Attach Click Events
    const prevBtn = document.getElementById('prevProfileBtn');
    const nextBtn = document.getElementById('nextProfileBtn');
    if (prevBtn) prevBtn.onclick = (e) => navigate(-1, e);
    if (nextBtn) nextBtn.onclick = (e) => navigate(1, e);

    // Swipe Logic
    let startX = 0;
    const swipeArea = document.getElementById('snapshotPreview');
    if (swipeArea) {
        const handleEnd = (endX, target) => {
            if (target.closest('button')) return;
            const diff = startX - endX;
            if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
        };
        swipeArea.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, {passive: true});
        swipeArea.addEventListener('touchend', (e) => { handleEnd(e.changedTouches[0].clientX, e.target); }, {passive: true});
        swipeArea.addEventListener('mousedown', (e) => { startX = e.clientX; });
        swipeArea.addEventListener('mouseup', (e) => { handleEnd(e.clientX, e.target); });
    }

    // === AMMO LIBRARY CONTROLLER BY ANTIGRAVITY ===
    const ammoLibraryModal = document.getElementById('ammoLibraryModal');
    const openAmmoLibraryBtn = document.getElementById('openAmmoLibraryBtn');
    const closeAmmoLibraryBtn = document.getElementById('closeAmmoLibraryBtn');
    const saveAmmoProfileBtn = document.getElementById('saveAmmoProfileBtn');
    const ammoLibraryList = document.getElementById('ammoLibraryList');

    // Input elements for ammo form
    const ammoInputs = {
        name: document.getElementById('ammo-name'),
        caliber: document.getElementById('ammo-caliber'),
        bullet: document.getElementById('ammo-bullet'),
        powder: document.getElementById('ammo-powder'),
        primer: document.getElementById('ammo-primer'),
        col: document.getElementById('ammo-col'),
        velocity: document.getElementById('ammo-velocity'),
        count: document.getElementById('ammo-count')
    };

    function getAmmoProfiles() {
        return JSON.parse(localStorage.getItem('rangeCardAmmoProfiles') || '{}');
    }

    function saveAmmoProfiles(profiles) {
        localStorage.setItem('rangeCardAmmoProfiles', JSON.stringify(profiles));
    }

    function updateAmmoList() {
        if (!ammoLibraryList) return;
        const profiles = getAmmoProfiles();
        ammoLibraryList.innerHTML = '';

        const keys = Object.keys(profiles);
        if (keys.length === 0) {
            ammoLibraryList.innerHTML = `
                <div class="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-12 text-center text-gray-600 font-mono text-xs uppercase tracking-wider">
                    <i data-lucide="info" class="w-8 h-8 opacity-20 mb-2"></i>
                    No saved ammo batches found.
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        keys.forEach(key => {
            const p = profiles[key];
            const card = document.createElement('div');
            card.className = "bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-md relative";
            card.innerHTML = `
                <div class="space-y-2 text-left">
                    <div class="flex justify-between items-start border-b border-gray-800 pb-2 mb-2">
                        <div>
                            <h4 class="text-white font-bold uppercase text-sm tracking-wide truncate max-w-[150px]">${key}</h4>
                            <span class="text-[9px] text-emerald-400 font-mono uppercase">${p.caliber || 'General'}</span>
                        </div>
                        <button class="delete-ammo-btn text-red-500 hover:text-red-400 p-1 bg-black/40 hover:bg-red-950/20 rounded transition-colors" data-name="${key}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-y-1.5 text-[10px] font-mono text-gray-400">
                        <div class="truncate">Bullet: <span class="text-gray-200 font-bold">${p.bullet || '--'}</span></div>
                        <div class="truncate">Powder: <span class="text-gray-200 font-bold">${p.powder || '--'}</span></div>
                        <div class="truncate">Primer: <span class="text-gray-200 font-bold">${p.primer || '--'}</span></div>
                        <div class="truncate">C.O.L: <span class="text-gray-200 font-bold">${p.col || '--'}</span></div>
                        <div class="truncate col-span-2">Velocity: <span class="text-gray-200 font-bold">${p.velocity || '--'} FPS</span></div>
                    </div>
                </div>
                
                <div class="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between gap-4">
                    <!-- Adjustment Counter -->
                    <div class="flex items-center gap-1.5 bg-black/40 p-1 rounded border border-gray-800">
                        <button class="adjust-ammo-btn bg-gray-800 text-white font-bold text-xs w-6 h-6 rounded flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors" data-name="${key}" data-amount="-1">-1</button>
                        <span class="text-white font-black text-xs px-2 min-w-[32px] text-center">${p.count || '0'} rds</span>
                        <button class="adjust-ammo-btn bg-gray-800 text-white font-bold text-xs w-6 h-6 rounded flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors" data-name="${key}" data-amount="1">+1</button>
                    </div>
                    
                    <button class="load-ammo-btn bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold py-1.5 px-3 rounded hover:bg-emerald-600/40 transition-colors" data-name="${key}">
                        Load to Card
                    </button>
                </div>
            `;
            ammoLibraryList.appendChild(card);
        });

        // Add event listeners inside list
        document.querySelectorAll('.delete-ammo-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const name = btn.getAttribute('data-name');
                if (confirm(`Delete ammo profile "${name}"?`)) {
                    const profiles = getAmmoProfiles();
                    delete profiles[name];
                    saveAmmoProfiles(profiles);
                    updateAmmoList();
                }
            };
        });

        document.querySelectorAll('.adjust-ammo-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const name = btn.getAttribute('data-name');
                const amt = parseInt(btn.getAttribute('data-amount')) || 0;
                const profiles = getAmmoProfiles();
                if (profiles[name]) {
                    profiles[name].count = Math.max(0, (parseInt(profiles[name].count) || 0) + amt);
                    saveAmmoProfiles(profiles);
                    updateAmmoList();
                }
            };
        });

        document.querySelectorAll('.load-ammo-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const name = btn.getAttribute('data-name');
                const profiles = getAmmoProfiles();
                const p = profiles[name];
                if (p) {
                    // Populate inputs in range-card form
                    if (p.caliber) document.getElementById('caliber').value = p.caliber;
                    if (p.bullet) document.getElementById('bullet').value = p.bullet;
                    if (p.powder) document.getElementById('powder').value = p.powder;
                    if (p.primer) document.getElementById('primer').value = p.primer;
                    if (p.col) document.getElementById('col').value = p.col;
                    if (p.velocity) document.getElementById('velocity').value = p.velocity;
                    if (p.count) document.getElementById('box-count-input').value = p.count;

                    // Manually trigger input events to sync display card
                    ['caliber', 'bullet', 'powder', 'primer', 'col', 'velocity', 'box-count-input'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.dispatchEvent(new Event('input'));
                    });

                    alert(`Loaded specifications for "${name}" into card!`);
                    if (ammoLibraryModal) ammoLibraryModal.classList.add('hidden');
                }
            };
        });

        if (window.lucide) lucide.createIcons();
    }

    if (openAmmoLibraryBtn && ammoLibraryModal) {
        openAmmoLibraryBtn.onclick = () => {
            ammoLibraryModal.classList.remove('hidden');
            updateAmmoList();
        };
    }

    if (closeAmmoLibraryBtn && ammoLibraryModal) {
        closeAmmoLibraryBtn.onclick = () => {
            ammoLibraryModal.classList.add('hidden');
        };
    }

    if (saveAmmoProfileBtn) {
        saveAmmoProfileBtn.onclick = () => {
            const name = ammoInputs.name.value.trim();
            if (!name) {
                alert("Please enter a load/batch name.");
                return;
            }

            const profiles = getAmmoProfiles();
            profiles[name] = {
                caliber: ammoInputs.caliber.value.trim(),
                bullet: ammoInputs.bullet.value.trim(),
                powder: ammoInputs.powder.value.trim(),
                primer: ammoInputs.primer.value.trim(),
                col: ammoInputs.col.value.trim(),
                velocity: ammoInputs.velocity.value.trim(),
                count: parseInt(ammoInputs.count.value) || 0
            };

            saveAmmoProfiles(profiles);
            updateAmmoList();

            // Clear inputs
            Object.values(ammoInputs).forEach(input => {
                if (input) input.value = '';
            });

            alert(`Successfully saved batch "${name}" to Ammo Library!`);
        };
    }

    // === 10. Tactical Recon Mapper ===
    let isReconActive = false;
    let selectedEmoji = null;
    const toggleReconMapperBtn = document.getElementById('toggleReconMapperBtn');
    const normalSidebarView = document.getElementById('normal-sidebar-view');
    const reconSidebarView = document.getElementById('recon-sidebar-view');
    const normalCardContainer = document.getElementById('card-container');
    const reconCardContainer = document.getElementById('recon-card-container');

    function syncReconPortal() {
        const normalMobilePreview = document.getElementById('mobile-live-preview-complete');
        const reconMobilePreview = document.getElementById('mobile-recon-preview-complete');
        
        if (isReconActive) {
            if (reconMobilePreview) reconMobilePreview.classList.remove('hidden');
            if (normalMobilePreview) normalMobilePreview.classList.add('hidden');
            
            // Sync labels to the mobile stacked form
            const titleLabel = document.getElementById('mobile-display-recon-title-label');
            const reportLabel = document.getElementById('mobile-display-recon-report-label');
            const timestampLabel = document.getElementById('mobile-display-recon-timestamp-label');
            
            if (titleLabel) titleLabel.textContent = document.getElementById('display-recon-title').textContent;
            if (reportLabel) reportLabel.textContent = document.getElementById('display-recon-report').textContent;
            if (timestampLabel) timestampLabel.textContent = document.getElementById('display-recon-timestamp').textContent;
        } else {
            if (reconMobilePreview) reconMobilePreview.classList.add('hidden');
            if (normalMobilePreview) normalMobilePreview.classList.remove('hidden');
        }
    }
    window.syncReconPortal = syncReconPortal;
    
    if (toggleReconMapperBtn) {
        toggleReconMapperBtn.addEventListener('click', () => {
            isReconActive = !isReconActive;
            if (isReconActive) {
                toggleReconMapperBtn.innerHTML = '<i data-lucide="crosshair" class="w-4 h-4"></i> BACK TO RANGE CARD';
                toggleReconMapperBtn.classList.replace('bg-indigo-950/40', 'bg-emerald-950/40');
                toggleReconMapperBtn.classList.replace('border-indigo-500', 'border-emerald-500');
                toggleReconMapperBtn.classList.replace('text-indigo-400', 'text-emerald-400');
                
                normalSidebarView.classList.add('hidden');
                reconSidebarView.classList.remove('hidden');
                normalCardContainer.classList.add('hidden');
                reconCardContainer.classList.remove('hidden');
                
                // Prevent accidentally clicking the standard save button while in Recon View
                const stdSave = document.getElementById('saveProfileBtnManual');
                if (stdSave) stdSave.classList.add('hidden');
            } else {
                toggleReconMapperBtn.innerHTML = '<i data-lucide="map" class="w-4 h-4"></i> TACTICAL RECON MAPPER';
                toggleReconMapperBtn.classList.replace('bg-emerald-950/40', 'bg-indigo-950/40');
                toggleReconMapperBtn.classList.replace('border-emerald-500', 'border-indigo-500');
                toggleReconMapperBtn.classList.replace('text-emerald-400', 'text-indigo-400');
                
                normalSidebarView.classList.remove('hidden');
                reconSidebarView.classList.add('hidden');
                normalCardContainer.classList.remove('hidden');
                reconCardContainer.classList.add('hidden');

                const stdSave = document.getElementById('saveProfileBtnManual');
                if (stdSave) stdSave.classList.remove('hidden');
            }
            syncReconPortal();
            if (window.lucide) window.lucide.createIcons();
        });
    }

    // SITREP & Scenario Title Synchronizer
    const reconScenarioName = document.getElementById('recon-scenario-name');
    const displayReconTitle = document.getElementById('display-recon-title');
    const reconReport = document.getElementById('recon-report');
    const displayReconReport = document.getElementById('display-recon-report');
    const displayReconTimestamp = document.getElementById('display-recon-timestamp');

    if (reconScenarioName && displayReconTitle) {
        reconScenarioName.addEventListener('input', () => {
            displayReconTitle.textContent = reconScenarioName.value.trim().toUpperCase() || 'NEW SCENARIO';
            syncReconPortal();
        });
    }
    if (reconReport && displayReconReport) {
        reconReport.addEventListener('input', () => {
            displayReconReport.textContent = reconReport.value.trim() || 'NO SITREP FILED';
            const now = new Date();
            if (displayReconTimestamp) {
                displayReconTimestamp.textContent = now.toLocaleTimeString() + " | " + now.toLocaleDateString();
            }
            syncReconPortal();
        });
    }

    const mapBgUpload = document.getElementById('map-bg-upload');
    const reconBgImage = document.getElementById('recon-bg-image');
    const reconDefaultGrid = document.getElementById('recon-default-grid');

    if (mapBgUpload && reconBgImage) {
        mapBgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
                    alert("Note: Apple HEIC/HEIF image formats are not natively supported by standard web browsers. Please convert your screenshot to PNG or JPG to upload successfully.");
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    // Update main desktop workspace background
                    reconBgImage.src = event.target.result;
                    reconBgImage.classList.remove('hidden');
                    if (reconDefaultGrid) reconDefaultGrid.classList.add('hidden');

                    // Update twin mobile workspace background
                    const mobileBg = document.getElementById('mobile-recon-bg-image');
                    const mobileGrid = document.getElementById('mobile-recon-default-grid');
                    if (mobileBg) {
                        mobileBg.src = event.target.result;
                        mobileBg.classList.remove('hidden');
                    }
                    if (mobileGrid) mobileGrid.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Emoji Marker Placement & Management
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    const workspace = document.getElementById('recon-map-workspace');

    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            emojiButtons.forEach(b => b.classList.remove('border-neon-green', 'bg-gray-800'));
            if (selectedEmoji === btn.dataset.emoji) {
                selectedEmoji = null;
            } else {
                selectedEmoji = btn.dataset.emoji;
                btn.classList.add('border-neon-green', 'bg-gray-800');
                
                // SPARK OF TOUCHSCREEN GENIUS: Spawn the marker at 50%, 50% automatically!
                if (typeof createMarker === 'function') {
                    createMarker(50, 50, selectedEmoji, '');
                }
            }
        });
    });

    if (workspace) {
        workspace.addEventListener('click', (e) => {
            if (e.target !== workspace && e.target.id !== 'recon-canvas' && e.target.id !== 'recon-default-grid') return;
            if (!selectedEmoji) return;
            
            const drawToggle = document.getElementById('recon-pencil-toggle');
            if (drawToggle && drawToggle.checked) return;

            const rect = workspace.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 100;
            const clickY = ((e.clientY - rect.top) / rect.height) * 100;

            createMarker(clickX, clickY, selectedEmoji, '');
        });
    }

    function createSingleMarker(x, y, emoji, note, isMobileTwin = false) {
        const targetWorkspace = isMobileTwin 
            ? document.getElementById('mobile-recon-map-workspace') 
            : document.getElementById('recon-map-workspace');
        if (!targetWorkspace) return null;

        const marker = document.createElement('div');
        marker.className = 'absolute select-none cursor-move z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded border border-emerald-500/40 hover:border-emerald-400 hover:scale-105 transition-all shadow-md recon-marker';
        if (isMobileTwin) marker.classList.add('mobile-recon-marker');
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        marker.dataset.emoji = emoji;
        marker.dataset.note = note;

        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'text-xl filter drop-shadow-sm select-none';
        emojiSpan.textContent = emoji;

        const noteSpan = document.createElement('span');
        noteSpan.className = 'text-[8px] font-extrabold text-white font-mono bg-emerald-950/80 border border-emerald-500/40 px-1 py-0.5 rounded uppercase leading-none tracking-wider select-none whitespace-nowrap marker-note-span';
        noteSpan.textContent = note || 'LABEL';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-[12px] text-red-400 hover:text-red-300 transition-colors bg-red-950/40 border border-red-500/30 w-5 h-5 rounded flex items-center justify-center p-0 ml-1 cursor-pointer font-sans font-black';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete Marker';
        
        // Stop drag & click propagation on contact
        deleteBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        deleteBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (confirm('Delete this marker?')) {
                if (marker.twin) marker.twin.remove();
                marker.remove();
            }
        });

        marker.appendChild(emojiSpan);
        marker.appendChild(noteSpan);
        marker.appendChild(deleteBtn);

        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            const newNote = prompt('Enter notes / yardage for this marker:', marker.dataset.note);
            if (newNote !== null) {
                const trimmed = newNote.trim();
                marker.dataset.note = trimmed;
                noteSpan.textContent = trimmed || 'LABEL';
                if (marker.twin) {
                    marker.twin.dataset.note = trimmed;
                    const twinNoteSpan = marker.twin.querySelector('.marker-note-span');
                    if (twinNoteSpan) twinNoteSpan.textContent = trimmed || 'LABEL';
                }
            }
        });

        let isDragging = false;

        const dragStart = (e) => {
            isDragging = true;
            e.stopPropagation();
        };

        const dragMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches && e.touches.length > 0 ? e.touches[0] : (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null);
            const clientX = touch ? touch.clientX : e.clientX;
            const clientY = touch ? touch.clientY : e.clientY;
            
            const rect = targetWorkspace.getBoundingClientRect();
            let pctX = ((clientX - rect.left) / rect.width) * 100;
            let pctY = ((clientY - rect.top) / rect.height) * 100;

            pctX = Math.max(1, Math.min(pctX, 88));
            pctY = Math.max(1, Math.min(pctY, 92));

            marker.style.left = `${pctX}%`;
            marker.style.top = `${pctY}%`;
            
            if (marker.twin) {
                marker.twin.style.left = `${pctX}%`;
                marker.twin.style.top = `${pctY}%`;
            }

            if (e.cancelable) e.preventDefault();
        };

        const dragEnd = () => {
            isDragging = false;
        };

        marker.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);

        marker.addEventListener('touchstart', dragStart, { passive: false });
        marker.addEventListener('touchmove', dragMove, { passive: false });
        marker.addEventListener('touchend', dragEnd);

        targetWorkspace.appendChild(marker);
        return marker;
    }

    function createMarker(x, y, emoji, note) {
        const desktopMarker = createSingleMarker(x, y, emoji, note, false);
        const mobileMarker = createSingleMarker(x, y, emoji, note, true);
        if (desktopMarker && mobileMarker) {
            desktopMarker.twin = mobileMarker;
            mobileMarker.twin = desktopMarker;
        }
    }
    window.createMarker = createMarker;

    // Recon Drawing Canvas Logic
    const reconCanvas = document.getElementById('recon-canvas');
    const mobileReconCanvas = document.getElementById('mobile-recon-canvas');
    const mobileReconBgImage = document.getElementById('mobile-recon-bg-image');
    const mobileReconDefaultGrid = document.getElementById('mobile-recon-default-grid');

    if (reconCanvas) {
        const rCtx = reconCanvas.getContext('2d');
        const mCtx = mobileReconCanvas ? mobileReconCanvas.getContext('2d') : null;
        let rDrawing = false;
        const reconPencilToggle = document.getElementById('recon-pencil-toggle');

        const getReconPos = (e, canvasEl) => {
            const rect = canvasEl.getBoundingClientRect();
            const touch = e.touches && e.touches.length > 0 ? e.touches[0] : (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null);
            const clientX = touch ? touch.clientX : e.clientX;
            const clientY = touch ? touch.clientY : e.clientY;
            return {
                x: ((clientX - rect.left) / rect.width) * canvasEl.width,
                y: ((clientY - rect.top) / rect.height) * canvasEl.height
            };
        };

        const startRDraw = (e) => {
            if (!reconPencilToggle || !reconPencilToggle.checked) return;
            if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
            rDrawing = true;
            
            const pos = getReconPos(e, e.currentTarget);
            rCtx.beginPath();
            rCtx.lineWidth = 1.0;
            rCtx.lineCap = 'round';
            rCtx.strokeStyle = '#ef4444';
            rCtx.moveTo(pos.x, pos.y);

            if (mCtx) {
                mCtx.beginPath();
                mCtx.lineWidth = 1.0;
                mCtx.lineCap = 'round';
                mCtx.strokeStyle = '#ef4444';
                mCtx.moveTo(pos.x, pos.y);
            }
        };

        const moveRDraw = (e) => {
            if (!rDrawing) return;
            if (e.type === 'touchmove' && e.cancelable) e.preventDefault();
            
            const pos = getReconPos(e, e.currentTarget);
            rCtx.lineTo(pos.x, pos.y);
            rCtx.stroke();

            if (mCtx) {
                mCtx.lineTo(pos.x, pos.y);
                mCtx.stroke();
            }
        };

        const stopRDraw = () => {
            if (!rDrawing) return;
            rCtx.closePath();
            if (mCtx) mCtx.closePath();
            rDrawing = false;
        };

        reconCanvas.addEventListener('mousedown', startRDraw);
        reconCanvas.addEventListener('mousemove', moveRDraw);
        reconCanvas.addEventListener('mouseup', stopRDraw);
        reconCanvas.addEventListener('touchstart', startRDraw, { passive: false });
        reconCanvas.addEventListener('touchmove', moveRDraw, { passive: false });
        reconCanvas.addEventListener('touchend', stopRDraw);

        if (mobileReconCanvas) {
            mobileReconCanvas.addEventListener('mousedown', startRDraw);
            mobileReconCanvas.addEventListener('mousemove', moveRDraw);
            mobileReconCanvas.addEventListener('mouseup', stopRDraw);
            mobileReconCanvas.addEventListener('touchstart', startRDraw, { passive: false });
            mobileReconCanvas.addEventListener('touchmove', moveRDraw, { passive: false });
            mobileReconCanvas.addEventListener('touchend', stopRDraw);
        }

        if (reconPencilToggle) {
            reconPencilToggle.addEventListener('change', () => {
                const label = reconPencilToggle.parentElement;
                if (reconPencilToggle.checked) {
                    label.classList.add('bg-emerald-950/40', 'border-emerald-500', 'text-emerald-400', 'shadow-lg', 'shadow-emerald-500/20');
                    label.querySelector('span').textContent = '🖊️ DRAWING ACTIVE';
                    reconCanvas.classList.remove('pointer-events-none');
                    if (mobileReconCanvas) mobileReconCanvas.classList.remove('pointer-events-none');
                } else {
                    label.classList.remove('bg-emerald-950/40', 'border-emerald-500', 'text-emerald-400', 'shadow-lg', 'shadow-emerald-500/20');
                    label.querySelector('span').textContent = '🖊️ DRAW PATH';
                    reconCanvas.classList.add('pointer-events-none');
                    if (mobileReconCanvas) mobileReconCanvas.classList.add('pointer-events-none');
                }
            });
        }

        document.getElementById('clear-recon-drawings').addEventListener('click', () => {
            if (confirm('Clear drawings and markers?')) {
                rCtx.clearRect(0, 0, reconCanvas.width, reconCanvas.height);
                if (mCtx) mCtx.clearRect(0, 0, mobileReconCanvas.width, mobileReconCanvas.height);
                
                document.querySelectorAll('.recon-marker').forEach(m => m.remove());
                
                reconBgImage.classList.add('hidden');
                reconBgImage.src = '';
                if (mobileReconBgImage) {
                    mobileReconBgImage.classList.add('hidden');
                    mobileReconBgImage.src = '';
                }
                
                if (reconDefaultGrid) reconDefaultGrid.classList.remove('hidden');
                if (mobileReconDefaultGrid) mobileReconDefaultGrid.classList.remove('hidden');
            }
        });

        const clearReconPencilBtn = document.getElementById('clear-recon-pencil');
        if (clearReconPencilBtn) {
            clearReconPencilBtn.addEventListener('click', () => {
                if (confirm('Clear pencil drawings only?')) {
                    rCtx.clearRect(0, 0, reconCanvas.width, reconCanvas.height);
                    if (mCtx) mCtx.clearRect(0, 0, mobileReconCanvas.width, mobileReconCanvas.height);
                }
            });
        }
    }

    // Save and Load from library using our robust IndexedDB
    const saveReconMapBtn = document.getElementById('saveReconMapBtn');
    const openReconLibraryBtn = document.getElementById('openReconLibraryBtn');

    if (saveReconMapBtn) {
        saveReconMapBtn.addEventListener('click', async () => {
            const name = reconScenarioName.value.trim();
            if (!name) {
                alert('Please set a Scenario Name first.');
                return;
            }

            const existingProfiles = getProfiles();
            const lowerName = name.trim().toLowerCase();
            const nameExists = Object.keys(existingProfiles).some(k => k.trim().toLowerCase() === lowerName);
            if (nameExists) {
                alert("SCENARIO NAME ALREADY EXISTS");
                return;
            }

            const reconCount = Object.keys(existingProfiles).filter(k => !!existingProfiles[k].isReconScenario).length;
            if (reconCount >= 20) {
                alert("LIBRARY FULL: RECON MAP CAPACITY REACHED (20/20). PLEASE DELETE OLD MAPS FIRST.");
                return;
            }

            // Friendly loading indicator
            saveReconMapBtn.disabled = true;
            const originalHTML = saveReconMapBtn.innerHTML;
            saveReconMapBtn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> GENERATING PREVIEW...';
            if (window.lucide) window.lucide.createIcons();

            const container = document.getElementById('recon-card-container');
            const previewPanel = document.getElementById('previewPanel');
            const isVisuallyHidden = previewPanel.classList.contains('opacity-0');

            // Force visual activation for html2canvas
            if (isVisuallyHidden) {
                previewPanel.classList.remove('opacity-0', 'pointer-events-none', 'absolute');
                previewPanel.classList.add('flex');
            }

            const originalTransform = container.style.transform;
            container.style.transform = 'none';
            const originalScrollY = window.scrollY;
            window.scrollTo(0, 0);

            const originalTransition = previewPanel.style.transition;
            previewPanel.style.transition = 'none';
            document.body.classList.add('is-capturing');

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
                    document.body.classList.remove('is-capturing');
                    previewPanel.style.transition = originalTransition;

                    if (isVisuallyHidden) {
                        previewPanel.classList.add('opacity-0', 'pointer-events-none', 'absolute');
                        previewPanel.classList.remove('flex');
                    }
                    container.style.transform = originalTransform;
                    window.scrollTo(0, originalScrollY);

                    const snapshotUrl = canvas.toDataURL("image/jpeg", 0.7);

                    const markers = [];
                    document.querySelectorAll('.recon-marker:not(.mobile-recon-marker)').forEach(m => {
                        markers.push({
                            x: parseFloat(m.style.left),
                            y: parseFloat(m.style.top),
                            emoji: m.dataset.emoji,
                            note: m.dataset.note
                        });
                    });

                    const drawingUrl = reconCanvas.toDataURL();

                    const reconData = {
                        id: 'recon-' + name.toLowerCase().replace(/\s+/g, '-'),
                        name: name,
                        isReconScenario: true,
                        snapshot: snapshotUrl,
                        bgImage: reconBgImage.classList.contains('hidden') ? '' : reconBgImage.src,
                        report: reconReport.value,
                        markers: markers,
                        drawing: drawingUrl,
                        timestamp: new Date().toISOString()
                    };

                    const ps = getProfiles();
                    ps[name] = reconData;

                    const postSave = () => {
                        saveReconMapBtn.disabled = false;
                        saveReconMapBtn.innerHTML = originalHTML;
                        if (window.lucide) window.lucide.createIcons();

                        window.currentLibraryFilter = 'all';
                        window.openLibrary();
                        if (window.previewProfile) window.previewProfile(name);
                    };

                    if (window.TRC_IDB) {
                        window.TRC_IDB.set('rangeCardProfiles', name, reconData).then(() => {
                            postSave();
                        }).catch(err => {
                            console.error("IDB save failed, falling back to localStorage:", err);
                            localStorage.setItem('rangeCardProfiles', JSON.stringify(ps));
                            postSave();
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

                    saveReconMapBtn.disabled = false;
                    saveReconMapBtn.innerHTML = originalHTML;
                    if (window.lucide) window.lucide.createIcons();

                    console.error("Recon capture failure:", err);
                    if (err && err.name === 'QuotaExceededError' || err.toString().includes('exceeded the quota')) {
                        alert("CRITICAL: Browser memory is 100% full! You must delete old Dope Cards or Recon Maps from the library before you can save this one.");
                    } else {
                        alert("Recon save failed. Please check log.");
                    }
                });
            }, 500);
        });
    }

    if (openReconLibraryBtn) {
        openReconLibraryBtn.addEventListener('click', () => {
            window.currentLibraryFilter = 'all';
            window.openLibrary();
        });
    }

    // === TACTICAL STOPWATCH CONTROLLER ===
    let timerInterval = null;
    let timerMilliseconds = 0;
    let isTimerRunning = false;

    const timerDisplay = document.getElementById('stopwatch-display');
    const timerStartBtn = document.getElementById('stopwatch-start');
    const timerResetBtn = document.getElementById('stopwatch-reset');

    function updateTimerDisplay() {
        if (!timerDisplay) return;
        let totalSeconds = Math.floor(timerMilliseconds / 1000);
        let mins = Math.floor(totalSeconds / 60);
        let secs = totalSeconds % 60;
        let tenths = Math.floor((timerMilliseconds % 1000) / 100);

        let displayMins = mins.toString().padStart(2, '0');
        let displaySecs = secs.toString().padStart(2, '0');
        
        timerDisplay.innerHTML = `${displayMins}:${displaySecs}<span class="text-xs text-neon-green/50">.${tenths}</span>`;
    }

    if (timerStartBtn) {
        timerStartBtn.addEventListener('click', () => {
            if (isTimerRunning) {
                // Pause
                clearInterval(timerInterval);
                timerStartBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4"></i>';
                timerStartBtn.classList.replace('bg-amber-950/40', 'bg-emerald-950/40');
                timerStartBtn.classList.replace('text-amber-500', 'text-emerald-400');
                timerStartBtn.classList.replace('border-amber-800', 'border-emerald-800');
                isTimerRunning = false;
            } else {
                // Start
                const startTime = Date.now() - timerMilliseconds;
                timerInterval = setInterval(() => {
                    timerMilliseconds = Date.now() - startTime;
                    updateTimerDisplay();
                }, 100);
                timerStartBtn.innerHTML = '<i data-lucide="pause" class="w-4 h-4"></i>';
                timerStartBtn.classList.replace('bg-emerald-950/40', 'bg-amber-950/40');
                timerStartBtn.classList.replace('text-emerald-400', 'text-amber-500');
                timerStartBtn.classList.replace('border-emerald-800', 'border-amber-800');
                isTimerRunning = true;
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }

    if (timerResetBtn) {
        timerResetBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            isTimerRunning = false;
            timerMilliseconds = 0;
            updateTimerDisplay();
            if (timerStartBtn) {
                timerStartBtn.innerHTML = '<i data-lucide="play" class="w-4 h-4"></i>';
                timerStartBtn.className = "bg-emerald-950/40 border border-emerald-800 text-emerald-400 p-2 rounded hover:bg-emerald-900/60 hover:border-emerald-600 transition-colors";
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }

    // =================================================================
    // === TACTICAL DUAL-VIEW HUD CONTROLLER ===
    // =================================================================
    const dualHudView = document.getElementById('dualHudView');
    const launchDualHudBtn = document.getElementById('launchDualHudBtn');
    const closeHudBtn = document.getElementById('closeHudBtn');
    
    const hudSelectCardBtn = document.getElementById('hudSelectCardBtn');
    const hudSelectMapBtn = document.getElementById('hudSelectMapBtn');
    const hudCardImg = document.getElementById('hudCardImg');
    const hudMapImg = document.getElementById('hudMapImg');
    const hudCardEmpty = document.getElementById('hudCardEmpty');
    const hudMapEmpty = document.getElementById('hudMapEmpty');
    
    const hudAssetSelectorOverlay = document.getElementById('hudAssetSelectorOverlay');
    const hudSelectorTitle = document.getElementById('hudSelectorTitle');
    const hudSelectorList = document.getElementById('hudSelectorList');
    const closeHudSelectorBtn = document.getElementById('closeHudSelectorBtn');

    let currentHudTarget = 'card'; // 'card' or 'map'

    // --- HUD Control & Open/Close ---
    if (launchDualHudBtn && dualHudView) {
        launchDualHudBtn.addEventListener('click', () => {
            dualHudView.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Lock main scroll
            if (window.lucide) window.lucide.createIcons();
        });
    }

    if (closeHudBtn) {
        closeHudBtn.addEventListener('click', () => {
            dualHudView.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scroll
        });
    }

    // --- Loader Logic ---
    function openHudAssetSelector(type) {
        currentHudTarget = type;
        hudSelectorTitle.textContent = type === 'card' ? 'SELECT RANGE CARD' : 'SELECT RECON MAP';
        hudSelectorList.innerHTML = '';

        const profiles = (typeof getProfiles === 'function') ? getProfiles() : {};
        let names = Object.keys(profiles).sort().reverse();

        // Filter by type
        if (type === 'card') {
            names = names.filter(n => !profiles[n].isReconScenario);
        } else {
            names = names.filter(n => !!profiles[n].isReconScenario);
        }

        if (names.length === 0) {
            hudSelectorList.innerHTML = `<div class="text-center py-8 text-gray-500 text-xs font-mono uppercase tracking-widest">No saved ${type}s found</div>`;
        } else {
            names.forEach(name => {
                const row = document.createElement('div');
                row.className = "p-3 bg-gray-900 hover:bg-orange-900/20 border border-gray-800 hover:border-orange-500/50 rounded cursor-pointer flex items-center justify-between transition-all group";
                
                const meta = profiles[name].isReconScenario 
                    ? `RECON • ${profiles[name].timestamp ? new Date(profiles[name].timestamp).toLocaleDateString() : 'Date Unknown'}` 
                    : `${profiles[name].caliber || 'NO CALIBER'} • ${profiles[name].date || '--'}`;

                row.innerHTML = `
                    <div class="min-w-0">
                        <div class="font-bold text-[11px] text-white truncate uppercase group-hover:text-orange-400">${name}</div>
                        <div class="text-[9px] text-gray-500 font-mono uppercase mt-0.5">${meta}</div>
                    </div>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-gray-600 group-hover:text-orange-400"></i>
                `;

                row.addEventListener('click', () => {
                    loadAssetIntoHud(profiles[name].snapshot);
                });
                
                hudSelectorList.appendChild(row);
            });
        }

        hudAssetSelectorOverlay.classList.remove('hidden');
        hudAssetSelectorOverlay.classList.add('flex');
        if (window.lucide) window.lucide.createIcons();
    }

    function loadAssetIntoHud(imgData) {
        if (!imgData) {
            alert("Error: No visual image snapshot found for this record.");
            return;
        }
        if (currentHudTarget === 'card') {
            hudCardImg.src = imgData;
            hudCardImg.classList.remove('hidden');
            hudCardEmpty.classList.add('hidden');
        } else {
            hudMapImg.src = imgData;
            hudMapImg.classList.remove('hidden');
            hudMapEmpty.classList.add('hidden');
        }
        // Close Selector
        hudAssetSelectorOverlay.classList.add('hidden');
        hudAssetSelectorOverlay.classList.remove('flex');
    }

    // --- Event Links ---
    if (hudSelectCardBtn) {
        hudSelectCardBtn.addEventListener('click', () => openHudAssetSelector('card'));
    }
    if (hudSelectMapBtn) {
        hudSelectMapBtn.addEventListener('click', () => openHudAssetSelector('map'));
    }
    if (closeHudSelectorBtn) {
        closeHudSelectorBtn.addEventListener('click', () => {
            hudAssetSelectorOverlay.classList.add('hidden');
            hudAssetSelectorOverlay.classList.remove('flex');
        });
    }
    // Close overlay on backdrop click
    if (hudAssetSelectorOverlay) {
        hudAssetSelectorOverlay.addEventListener('click', (e) => {
            if (e.target === hudAssetSelectorOverlay) {
                hudAssetSelectorOverlay.classList.add('hidden');
                hudAssetSelectorOverlay.classList.remove('flex');
            }
        });
    }

    // Force initial sync
    if (window.updateProfileList) window.updateProfileList();

    // ========================================================================
    // PRO UPGRADE: TACTICAL TOOLS DASHBOARD CORE LOGIC
    // ========================================================================
    const dashShell = document.getElementById('tacticalDashboard');
    const launchBtn = document.getElementById('launchToolsDashboardBtn');
    const exitBtn = document.getElementById('exitDashboardBtn');

    if (launchBtn && dashShell) {
        launchBtn.addEventListener('click', () => {
            dashShell.classList.remove('hidden');
            dashShell.classList.add('flex');
            document.body.classList.add('tactical-dashboard-active');
            // Update live clock loop if not already running
            if (!window.dashClockInterval) {
                const updateClock = () => {
                    const el = document.getElementById('dash-clock');
                    if(el) el.textContent = new Date().toLocaleTimeString('en-US', {hour12: false});
                };
                updateClock();
                window.dashClockInterval = setInterval(updateClock, 1000);
            }
            if (window.lucide) lucide.createIcons();
        });
    }

    if (exitBtn && dashShell) {
        exitBtn.addEventListener('click', () => {
            dashShell.classList.add('hidden');
            dashShell.classList.remove('flex');
            document.body.classList.remove('tactical-dashboard-active');
            
            // Reset any fullscreen panels back to normal on shutdown
            document.querySelectorAll('.dash-panel.is-maximized').forEach(el => {
                el.classList.remove('is-maximized');
                // Restore icon
                const btn = el.querySelector('.maximize-btn i');
                if(btn) btn.setAttribute('data-lucide', 'maximize-2');
            });
            if(window.lucide) lucide.createIcons();
        });
    }

    // GLOBAL FULLSCREEN TOGGLE HELPER (Exposed to window for onclick attributes)
    window.toggleFullscreen = function(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const isMax = panel.classList.contains('is-maximized');
        
        // Close all other maximized panels first to ensure cleanliness
        document.querySelectorAll('.dash-panel.is-maximized').forEach(el => {
            el.classList.remove('is-maximized');
            const icon = el.querySelector('.maximize-btn [data-lucide]');
            if(icon) {
                const newI = document.createElement('i');
                newI.setAttribute('data-lucide', 'maximize-2');
                newI.className = icon.getAttribute('class').replace(/lucide(-[a-z0-9]+)?/g, '').trim();
                if(!newI.className) newI.className = 'w-3.5 h-3.5';
                icon.replaceWith(newI);
            }
        });

        if (!isMax) {
            panel.classList.add('is-maximized');
            const icon = panel.querySelector('.maximize-btn [data-lucide]');
            if(icon) {
                const newI = document.createElement('i');
                newI.setAttribute('data-lucide', 'minimize-2');
                newI.className = icon.getAttribute('class').replace(/lucide(-[a-z0-9]+)?/g, '').trim();
                if(!newI.className) newI.className = 'w-3.5 h-3.5';
                icon.replaceWith(newI);
            }

            // === TRIGGER SPECIFIC PANEL LOGIC ON OPEN ===
            if (panelId === 'panel-dope-select') {
                document.getElementById('dope-cache-selector-grid').classList.remove('hidden');
                document.getElementById('dope-cache-selector-grid').classList.add('flex');
                refreshDopeCacheGrid();
            } else if (panelId === 'panel-sat-select') {
                document.getElementById('sat-archive-selector-grid').classList.remove('hidden');
                document.getElementById('sat-archive-selector-grid').classList.add('flex');
                refreshSatArchiveGrid();
            } else if (panelId === 'panel-measuring') {
                // UNCONDITIONAL FORCED VISIBILITY INJECTION
                document.getElementById('geo-toolkit-bar')?.classList.remove('hidden');
                document.getElementById('geo-ruler-footer')?.classList.remove('hidden');
                document.getElementById('live-sat-map-container')?.classList.remove('pointer-events-none');
                setTimeout(() => { if(orbitalMap) orbitalMap.invalidateSize(); }, 200);
            } else if (panelId === 'panel-vault') {
                document.getElementById('vault-selector-grid').classList.remove('hidden');
                document.getElementById('vault-selector-grid').classList.add('flex');
                refreshVaultGrid();
            }
        } else {
            // === CLEANUP SPECIFIC PANEL LOGIC ON CLOSE ===
            if (panelId === 'panel-dope-select') {
                document.getElementById('dope-cache-selector-grid').classList.add('hidden');
                document.getElementById('dope-cache-selector-grid').classList.remove('flex');
            } else if (panelId === 'panel-sat-select') {
                document.getElementById('sat-archive-selector-grid').classList.add('hidden');
                document.getElementById('sat-archive-selector-grid').classList.remove('flex');
            } else if (panelId === 'panel-measuring') {
                // UNCONDITIONAL FORCED HIDE INJECTION FOR MINIMIZED MODE
                document.getElementById('geo-toolkit-bar')?.classList.add('hidden');
                document.getElementById('geo-ruler-footer')?.classList.add('hidden');
                document.getElementById('live-sat-map-container')?.classList.add('pointer-events-none');
                setTimeout(() => { if(orbitalMap) orbitalMap.invalidateSize(); }, 200);
            } else if (panelId === 'panel-vault') {
                document.getElementById('vault-selector-grid').classList.add('hidden');
                document.getElementById('vault-selector-grid').classList.remove('flex');
            }
        }
        
        if(window.lucide) lucide.createIcons();
    };

    // ------------------------------------------------------------------------
    // 5. TAC-COMMS: DYNAMIC LOGGING INFRASTRUCTURE
    // ------------------------------------------------------------------------
    window.pushTacLog = function(message, type = 'INFO') {
        const feed = document.getElementById('tac-log-feed');
        const container = document.getElementById('tac-log-container');
        if (!feed) return;

        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = document.createElement('div');
        
        // Type styles
        let prefixColor = 'text-emerald-600';
        let textColor = 'text-gray-400';
        if (type === 'ALERT') { prefixColor = 'text-red-500'; textColor = 'text-red-200'; }
        if (type === 'SUCCESS') { prefixColor = 'text-neon-green'; textColor = 'text-white font-bold'; }
        if (type === 'LOCK') { prefixColor = 'text-pink-500'; textColor = 'text-pink-200 font-bold'; }
        if (type === 'SYS') { prefixColor = 'text-blue-400'; textColor = 'text-blue-100'; }

        entry.className = `flex items-start gap-1.5 border-l-2 border-gray-800/50 pl-1 py-0.5 hover:bg-white/5 transition-colors group`;
        entry.innerHTML = `
            <span class="text-[7px] text-gray-600 font-mono group-hover:text-emerald-700 transition-colors">${timestamp}</span>
            <span class="font-black tracking-tighter text-[8px] ${prefixColor}">[${type}]</span>
            <span class="${textColor} uppercase tracking-wide leading-tight flex-1 text-[10px]">${message}</span>
        `;
        
        feed.appendChild(entry);
        
        // Keep scrolling to bottom for live updates!
        if(container) {
            container.scrollTop = container.scrollHeight;
        }
    };

    // Fire final cold-boot signal!
    setTimeout(() => window.pushTacLog("TACTICAL FEED ACTIVATED. READY TO TRANSMIT.", "SYS"), 2000);

    // ========================================================================
    // DOPE CACHE GRID SELECTOR SYSTEM
    // ========================================================================
    window.unloadDashboardCard = function(win) {
        window.pushTacLog(`SYSTEM: PANEL ${win} RESET INITIATED`, "SYS");
        if (win === 1) {
            const t = document.getElementById('dope-cache-active-display');
            if (!t) return;
            t.className = "w-full h-full flex items-center justify-center text-center px-2 group-hover:bg-emerald-500/5 transition-all";
            t.innerHTML = `<div class="text-center">
                                <i data-lucide="clipboard-list" class="w-6 h-6 text-gray-700 mx-auto mb-1 group-hover:text-emerald-600 transition-all"></i>
                                <p class="text-[8px] font-mono text-gray-500 uppercase tracking-[0.2em]">LOAD DOPE CACHE</p>
                            </div>`;
        } else if (win === 2) {
            const t = document.getElementById('sat-archive-active-display');
            if (!t) return;
            t.className = "w-full h-full flex items-center justify-center text-center px-2 group-hover:bg-emerald-500/5 transition-all";
            t.innerHTML = `<div class="text-center">
                                <i data-lucide="map" class="w-6 h-6 text-gray-700 mx-auto mb-1 group-hover:text-emerald-600 transition-all"></i>
                                <p class="text-[8px] font-mono text-gray-500 uppercase tracking-[0.2em]">ACCESS SAT ARCHIVE</p>
                            </div>`;
        } else if (win === 4) {
            const t = document.getElementById('vault-active-display');
            if (!t) return;
            t.innerHTML = `<div class="text-center">
                                <i data-lucide="database" class="w-6 h-6 text-gray-700 mx-auto mb-1 group-hover:text-emerald-600"></i>
                                <p class="text-[8px] font-mono text-gray-500 uppercase tracking-[0.2em]">SECURE INTEL VAULT</p>
                            </div>`;
        }
        if(window.lucide) lucide.createIcons();
    }

    function refreshDopeCacheGrid() {
        const container = document.getElementById('dope-cache-list-injection');
        if (!container) return;
        container.innerHTML = '';

        const profiles = window.getProfiles ? window.getProfiles() : {};
        // Filter strictly to Dope Cards (NO HIDDEN FILTERS!)
        const names = Object.keys(profiles).filter(n => !profiles[n].isReconScenario).sort().reverse();

        if (names.length === 0) {
            container.innerHTML = `<div class="col-span-full p-10 text-center border border-dashed border-gray-800 text-gray-600 uppercase font-mono text-xs">
                <i data-lucide="database" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                Library Empty.<br>Please create & save a Dope Card in main forms first.
            </div>`;
            if(window.lucide) lucide.createIcons();
            return;
        }

        names.forEach(name => {
            const p = profiles[name];
            const card = document.createElement('div');
            card.className = "bg-gray-900/80 border border-gray-800 rounded hover:border-emerald-500 hover:bg-emerald-950/20 transition-all p-2 cursor-pointer group relative overflow-hidden flex flex-col h-full";
            
            // Try to extract a tiny preview from the snapshot if available
            let imgHtml = `<div class="aspect-[4/3] bg-black/50 flex items-center justify-center mb-2 border border-gray-800"><i data-lucide="image" class="text-gray-700 w-6 h-6"></i></div>`;
            if (p.snapshot) {
                imgHtml = `<div class="aspect-[4/3] w-full mb-2 border border-gray-800 overflow-hidden bg-white flex items-center justify-center"><img src="${p.snapshot}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"></div>`;
            }

            card.innerHTML = `
                ${imgHtml}
                <div class="flex-1">
                    <h4 class="text-[10px] font-bold text-gray-200 truncate uppercase">${name}</h4>
                    <div class="flex justify-between mt-1">
                        <span class="text-[8px] font-mono text-emerald-500">${p.caliber || 'UNSET'}</span>
                        <span class="text-[8px] font-mono text-gray-600">${p.date || '--'}</span>
                    </div>
                </div>
                
                <div class="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 pointer-events-none border-2 border-transparent group-hover:border-emerald-500/50 rounded transition-all"></div>
                
                <!-- Send to Vault Checkbox -->
                <div class="absolute top-1 left-1 z-30 bg-black/60 p-0.5 rounded">
                    <input type="checkbox" class="dope-vault-checkbox w-3.5 h-3.5 cursor-pointer" data-profile-name="${name}" title="Mark for Vault">
                </div>
                
                <!-- Delete Button -->
                <button class="absolute top-1 right-1 z-30 bg-red-950/80 text-red-400 p-1 rounded border border-red-900/50 hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100" onclick="event.stopPropagation(); window.deleteRangeProfile('${name.replace(/'/g, "\\'")}')" title="Delete Profile">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            `;
            
            // Handle Selection ONLY (ignore checkbox clicks)
            card.addEventListener('click', (e) => {
                if (e.target.closest('.dope-vault-checkbox')) {
                    // Update button visibility
                    const anyChecked = document.querySelectorAll('.dope-vault-checkbox:checked').length > 0;
                    const btn = document.getElementById('dope-to-vault-btn');
                    if (btn) {
                        if (anyChecked) btn.classList.remove('hidden');
                        else btn.classList.add('hidden');
                    }
                    return;
                }
                e.stopPropagation();
                selectDopeCardForDashboard(name, p);
            });
            
            container.appendChild(card);
        });
        if(window.lucide) lucide.createIcons();
        
        // Ensure button starts hidden
        const btn = document.getElementById('dope-to-vault-btn');
        if (btn) btn.classList.add('hidden');
    }

    function selectDopeCardForDashboard(name, data) {
        // BROADCAST TO TICKER
        window.pushTacLog(`DOPE CACHE ACCESSED: LOADED ${name.toUpperCase()}`, "SUCCESS");
        
        const target = document.getElementById('dope-cache-active-display');
        if (!target) return;

        // Set miniature preview in window 1
        target.innerHTML = `
            <div class="w-full h-full bg-black overflow-hidden flex items-center justify-center relative">
                ${data.snapshot ? `<img src="${data.snapshot}" class="w-full h-full object-contain">` : ''}
                
                <!-- Floating Badge overlay so detail is not obscured -->
                <div class="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
                <div class="absolute bottom-1 left-1 z-20 text-[9px] font-black text-emerald-400 drop-shadow-md truncate max-w-[60%] uppercase">
                    ${name}
                </div>
                <div class="absolute bottom-1 right-1 z-20 bg-black/80 border border-emerald-900 text-emerald-500 px-1 py-0.5 rounded text-[7px] font-mono font-bold">
                    CAL: ${data.caliber || '---'}
                </div>
                <!-- Non-Destructive Unload Actuator -->
                <button class="absolute top-1 right-1 bg-red-950/90 text-red-300 border border-red-600/50 p-1 rounded z-30 hover:bg-red-600 hover:text-white transition-all shadow-lg" onclick="event.stopPropagation(); window.unloadDashboardCard(1)" title="Unload Card">
                    <i data-lucide="trash-2" class="w-2.5 h-2.5"></i>
                </button>
            </div>
        `;
        
        if(window.lucide) lucide.createIcons();
        
        // Auto-Minimize back to grid!
        window.toggleFullscreen('panel-dope-select');
    }

    // ========================================================================
    // SAT ARCHIVE GRID SELECTOR SYSTEM
    // ========================================================================
    function refreshSatArchiveGrid() {
        const container = document.getElementById('sat-archive-list-injection');
        if (!container) return;
        container.innerHTML = '';

        const profiles = window.getProfiles ? window.getProfiles() : {};
        // Filter strictly to Recon Maps (No hide exclusions)
        const names = Object.keys(profiles).filter(n => !!profiles[n].isReconScenario).sort().reverse();

        if (names.length === 0) {
            container.innerHTML = `<div class="col-span-full p-10 text-center border border-dashed border-gray-800 text-gray-600 uppercase font-mono text-xs">
                <i data-lucide="satellite" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                No Maps Detected.<br>Please construct & save a Recon Map first.
            </div>`;
            if(window.lucide) lucide.createIcons();
            return;
        }

        names.forEach(name => {
            const p = profiles[name];
            const card = document.createElement('div');
            card.className = "bg-gray-900/80 border border-gray-800 rounded hover:border-emerald-500 hover:bg-emerald-950/20 transition-all p-2 cursor-pointer group relative overflow-hidden flex flex-col h-full";
            
            // Handle map backdrop (CRITICAL SWAP: Prefer snapshot to inherit emojis and drawings automatically)
            const mapSrc = p.snapshot || p.bgImage || null;
            let imgHtml = `<div class="aspect-[4/3] bg-black/50 flex items-center justify-center mb-2 border border-gray-800"><i data-lucide="image" class="text-gray-700 w-6 h-6"></i></div>`;
            if (mapSrc) {
                imgHtml = `<div class="aspect-[4/3] w-full mb-2 border border-gray-800 overflow-hidden bg-black flex items-center justify-center relative">
                    <img src="${mapSrc}" class="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity">
                </div>`;
            }

            card.innerHTML = `
                ${imgHtml}
                <div class="flex-1">
                    <h4 class="text-[10px] font-bold text-emerald-100 truncate uppercase">${name}</h4>
                    <div class="flex justify-between mt-1">
                        <span class="text-[8px] font-mono text-gray-400 uppercase">RECON SITREP</span>
                        <span class="text-[8px] font-mono text-gray-600">${p.timestamp ? new Date(p.timestamp).toLocaleDateString() : '--'}</span>
                    </div>
                </div>
                
                <div class="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 pointer-events-none border-2 border-transparent group-hover:border-emerald-500/50 rounded transition-all"></div>
                
                <!-- Send to Vault Checkbox -->
                <div class="absolute top-1 left-1 z-30 bg-black/60 p-0.5 rounded">
                    <input type="checkbox" class="sat-vault-checkbox w-3.5 h-3.5 cursor-pointer" data-profile-name="${name}" title="Mark for Vault">
                </div>
                
                <!-- Delete Button -->
                <button class="absolute top-1 right-1 z-30 bg-red-950/80 text-red-400 p-1 rounded border border-red-900/50 hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100" onclick="event.stopPropagation(); window.deleteRangeProfile('${name.replace(/'/g, "\\'")}')" title="Delete Profile">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            `;
            
            // Bind selection handler ONLY (ignore checkbox clicks)
            card.addEventListener('click', (e) => {
                if (e.target.closest('.sat-vault-checkbox')) {
                    // Update button visibility
                    const anyChecked = document.querySelectorAll('.sat-vault-checkbox:checked').length > 0;
                    const btn = document.getElementById('sat-to-vault-btn');
                    if (btn) {
                        if (anyChecked) btn.classList.remove('hidden');
                        else btn.classList.add('hidden');
                    }
                    return;
                }
                e.stopPropagation();
                selectSatArchiveForDashboard(name, p);
            });

            container.appendChild(card);
        });
        if (window.lucide) lucide.createIcons();
        
        // Ensure button starts hidden
        const btn = document.getElementById('sat-to-vault-btn');
        if (btn) btn.classList.add('hidden');
    }

    function selectSatArchiveForDashboard(name, data) {
        // BROADCAST TO TICKER
        window.pushTacLog(`SITREP INGESTED: SYNCED ${name.toUpperCase()}`, "SUCCESS");

        const target = document.getElementById('sat-archive-active-display');
        if (!target) return;

        // CRITICAL SIMPLIFICATION: Load high-fidelity pre-baked full card snapshot ONLY (identical logic to Window 1)
        const highFidelitySnapshot = data.snapshot || data.bgImage || '';

        target.innerHTML = `
            <div class="w-full h-full bg-black flex items-center justify-center overflow-hidden relative">
                ${highFidelitySnapshot ? `<img src="${highFidelitySnapshot}" class="w-full h-full object-contain block pointer-events-none">` : ''}
                
                <!-- Floating Header Badge Overlay -->
                <div class="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-black via-black/50 to-transparent z-10"></div>
                <div class="absolute top-1 left-1 z-20 opacity-95 bg-emerald-950/90 border border-emerald-600 text-emerald-300 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,0,0,0.8)] font-black uppercase text-[7px] tracking-wider flex items-center gap-1">
                    <span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> MAP: ${name}
                </div>

                <!-- Non-Destructive Unload Actuator -->
                <button class="absolute top-1 right-1 bg-red-950/90 text-red-300 border border-red-600/50 p-1 rounded z-30 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_10px_rgba(0,0,0,0.8)]" onclick="event.stopPropagation(); window.unloadDashboardCard(2)" title="Unload Map">
                    <i data-lucide="trash-2" class="w-2.5 h-2.5"></i>
                </button>
            </div>
        `;
        
        if(window.lucide) lucide.createIcons();
        
        // Auto-Minimize back to grid!
        window.toggleFullscreen('panel-sat-select');
    }

    // ========================================================================
    // WEATHER / ATMOSPHERIC TELEMETRY SYNC
    // ========================================================================
    const syncWxBtn = document.getElementById('sync-wx-btn');
    if (syncWxBtn) {
        syncWxBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent maximizing dashboard just from clicking sync button
            fetchTacticalWeather();
        });
    }

    function fetchTacticalWeather() {
        const btn = document.getElementById('sync-wx-btn');
        const statusEl = document.getElementById('wx-status');
        
        if (!navigator.geolocation) {
            alert("Geolocation not supported by browser.");
            return;
        }

        // UI Feedback for loading state
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="animate-pulse">📡 ACQUIRING ORBITAL LOC...</span>`;
        btn.disabled = true;
        statusEl.textContent = 'SYNCING...';
        statusEl.className = 'text-[7px] font-bold text-yellow-500 uppercase';

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                
                btn.innerHTML = `<span class="animate-pulse">☁️ STREAMING CLIMATE...</span>`;

                // 1. Call Extended Open-Meteo API including Weather Code for Sky State
                const apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

                fetch(apiURL)
                    .then(response => response.json())
                    .then(data => {
                        const c = data.current;
                        if (!c) throw new Error("Incomplete stream data");

                        // 2. UNIT CONVERSIONS (HPA to INHG)
                        const hpa = c.surface_pressure;
                        const inHg = hpa * 0.02953;
                        const tempF = c.temperature_2m;

                        // 3. DYNAMIC DENSITY ALTITUDE CALCULATION (Unified High-Fidelity Physics)
                        const pressRatio = inHg / 29.92;
                        const tempRatio = 518.67 / (459.67 + tempF);
                        const airDensityRatio = pressRatio * tempRatio;
                        const densAlt = Math.round((1 - Math.pow(airDensityRatio, 1 / 4.25588)) / 0.0000068753);

                        // 4. WMO WEATHER CODE MAPPING
                        let skyCond = "CLEAR";
                        const code = c.weather_code;
                        if (code === 0) skyCond = "CLEAR";
                        else if (code <= 3) skyCond = "CLOUDY";
                        else if (code === 45 || code === 48) skyCond = "FOGGY";
                        else if (code >= 51 && code <= 67) skyCond = "RAINY";
                        else if (code >= 71 && code <= 77) skyCond = "SNOWY";
                        else if (code >= 80 && code <= 82) skyCond = "SHOWERS";
                        else if (code >= 95) skyCond = "STORM";
                        else skyCond = "DUSTY/HAZY";

                        // 5. INJECT INTELLIGENCE INTO GRID
                        document.getElementById('wx-temp').textContent = Math.round(tempF);
                        document.getElementById('wx-wind-speed').textContent = Math.round(c.wind_speed_10m);
                        document.getElementById('wx-wind-dir').textContent = `DEG ${Math.round(c.wind_direction_10m)}`;
                        
                        // Push converted inHg with decimal precision
                        document.getElementById('wx-pres').textContent = inHg.toFixed(2);
                        document.getElementById('wx-humid').textContent = Math.round(c.relative_humidity_2m);
                        
                        // Push our 3 new high-level data points
                        const condEl = document.getElementById('wx-cond');
                        const daEl = document.getElementById('wx-da');
                        const elevEl = document.getElementById('wx-elev');
                        
                        if (condEl) condEl.textContent = skyCond;
                        if (daEl) daEl.textContent = densAlt.toLocaleString();
                        
                        // Extract Ground Elevation from Topographical Model (Meters to Feet)
                        if (elevEl && data.elevation !== undefined) {
                            const fieldElevFeet = Math.round(data.elevation * 3.28084);
                            elevEl.textContent = fieldElevFeet.toLocaleString();
                        }
                        
                        // AUTO-SYNC TO BALLISTIC SOLVER INPUTS
                        document.getElementById('bal-input-temp').value = Math.round(tempF);
                        document.getElementById('bal-input-baro').value = inHg.toFixed(2);
                        document.getElementById('bal-input-wind').value = Math.round(c.wind_speed_10m);
                        document.getElementById('bal-input-wind-dir').value = Math.round(c.wind_direction_10m);
                        runSolverMatrix(); // Force instant re-calculation so HUD updates
                        

                        // Success State Update
                        statusEl.textContent = 'SYNCED';
                        statusEl.className = 'text-[7px] font-bold text-emerald-500 uppercase';
                        
                        btn.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> SYSTEM CALIBRATED`;
                        btn.className = "mt-3 w-full bg-emerald-950/40 border border-emerald-900/60 py-1.5 rounded text-[8px] font-black uppercase text-emerald-400 flex items-center justify-center gap-1.5 tracking-[0.15em]";
                        btn.disabled = false;

                        // Refresh Lucide for checkmark
                        if(window.lucide) lucide.createIcons();

                        // Reset button style back after 5 seconds
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                            btn.className = "mt-3 w-full bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/60 py-1.5 rounded text-[8px] font-black uppercase text-blue-300 flex items-center justify-center gap-1.5 tracking-[0.15em] transition-all active:scale-95";
                            if(window.lucide) lucide.createIcons();
                        }, 5000);
                    })
                    .catch(err => {
                        console.error("WX ERROR:", err);
                        statusEl.textContent = 'STREAM FAIL';
                        statusEl.className = 'text-[7px] font-bold text-red-500 uppercase';
                        btn.innerHTML = `<i data-lucide="alert-triangle" class="w-3 h-3"></i> RETRY SYNC`;
                        btn.disabled = false;
                        if(window.lucide) lucide.createIcons();
                    });
            },
            (error) => {
                console.error("GPS ERROR:", error);
                alert("Location Access Denied or Unavailable.");
                statusEl.textContent = 'NO GPS';
                statusEl.className = 'text-[7px] font-bold text-red-500 uppercase';
                btn.innerHTML = originalText;
                btn.disabled = false;
                if(window.lucide) lucide.createIcons();
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    // ========================================================================
    // GEOSPATIAL ORBITAL VECTOR MAP
    // ========================================================================
    let orbitalMap = null;
    let mapMarkers = [];
    let mapPolyline = null;
    let mapLabelMarker = null;

    function initGeoCanvas() {
        // Redirect call from the old function name to new Map engine
        initLiveMap();
    }

    function initLiveMap() {
        const container = document.getElementById('live-sat-map-container');
        if (!container) return;

        // 1. Create the Map if it hasn't been instantiated yet
        if (!orbitalMap) {
            // Force Canvas rendering instead of SVG so snapshots work flawlessly
            orbitalMap = L.map(container, {
                zoomControl: false,
                attributionControl: false,
                preferCanvas: true 
            }).setView([39.8283, -98.5795], 4); 

            // 2. Load World Imagery Tile Layer (Satellite)
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                attribution: 'Tiles &copy; Esri'
            }).addTo(orbitalMap);

            // Push Zoom control to a custom location so it doesn't mess with our headers
            L.control.zoom({ position: 'bottomright' }).addTo(orbitalMap);

            // 3. Add Global Map Click Listener for Vector Points
            orbitalMap.on('click', handleMapClick);

            // Auto-Trigger initial GPS sync to find where the user currently is!
            syncMapToGps();
        } else {
            // If it exists, just force an invalidation to correct size after maximizing
            orbitalMap.invalidateSize();
        }
    }

    function syncMapToGps() {
        if (!navigator.geolocation) return;
        
        const btn = document.getElementById('geo-live-gps-btn');
        const origHtml = btn.innerHTML;
        btn.innerHTML = `<span class="animate-pulse">🛰️ LOCATING...</span>`;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                if (orbitalMap) {
                    orbitalMap.setView([lat, lon], 17); // High Zoom
                }
                btn.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> GPS LOCKED`;
                if(window.lucide) lucide.createIcons();
                setTimeout(() => { btn.innerHTML = origHtml; if(window.lucide) lucide.createIcons(); }, 2000);
            },
            (err) => {
                console.error(err);
                btn.innerHTML = `❌ GPS FAIL`;
                setTimeout(() => { btn.innerHTML = origHtml; if(window.lucide) lucide.createIcons(); }, 2000);
            },
            { enableHighAccuracy: true }
        );
    }

    function handleMapClick(e) {
        const latlng = e.latlng;

        // Cycle limit to 2 points (Starting new measure sequence on 3rd click)
        if (mapMarkers.length >= 2) {
            clearMapMeasurements();
        }

        // Create visual point (HIGH CONTRAST PINK OVERRIDE)
        const marker = L.circleMarker(latlng, {
            radius: 6,
            color: '#ff1493', // HOT PINK for maximum visibility on map
            fillColor: '#000',
            fillOpacity: 1,
            weight: 2
        }).addTo(orbitalMap);

        mapMarkers.push(marker);

        // If we have two points, calculate accurate real world geodesic distance!
        if (mapMarkers.length === 2) {
            drawMapLine();
        } else {
            document.getElementById('live-map-dist').textContent = "--.--";
        }
    }

    function drawMapLine() {
        if (!orbitalMap || mapMarkers.length < 2) return;

        const latlng1 = mapMarkers[0].getLatLng();
        const latlng2 = mapMarkers[1].getLatLng();

        // Create Visual Path Line (HOT PINK DOTTED OVERRIDE)
        mapPolyline = L.polyline([latlng1, latlng2], {
            color: '#ff1493', // HOT PINK
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.9
        }).addTo(orbitalMap);

        // === MIDPOINT LABEL INJECTION (HOT PINK DISTANCE) ===
        const midLat = (latlng1.lat + latlng2.lat) / 2;
        const midLng = (latlng1.lng + latlng2.lng) / 2;
        
        // Spherical Earth Math
        const distanceMeters = latlng1.distanceTo(latlng2);
        const distanceYards = distanceMeters * 1.09361;
        const formattedYards = distanceYards.toFixed(1);

        const labelHtml = `<div style="color:#ff1493; font-family:'JetBrains Mono', monospace; font-weight:900; font-size:12px; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; white-space:nowrap;">${formattedYards} YDS</div>`;
        const customIcon = L.divIcon({
            html: labelHtml,
            className: 'map-distance-label',
            iconSize: [60, 20],
            iconAnchor: [30, 10]
        });

        if(mapLabelMarker) orbitalMap.removeLayer(mapLabelMarker);
        mapLabelMarker = L.marker([midLat, midLng], { icon: customIcon }).addTo(orbitalMap);

        // Update Master Footer Counter
        document.getElementById('live-map-dist').textContent = formattedYards;
        
        // BROADCAST LOG TO TAC-COMMS
        window.pushTacLog(`ORBITAL VECTOR SECURED: ${formattedYards} YARDS.`, "LOCK");
        
        // === PERSIST TO MINIMIZED PANEL VIEW ===
        const minimized = document.getElementById('geo-minimized-view');
        if (minimized) {
            minimized.innerHTML = `
                <div class="w-full h-full bg-emerald-950/20 flex flex-col items-center justify-center p-2 text-center relative group-hover:bg-emerald-500/5 transition-all">
                    <div class="absolute top-1 left-1 text-[6px] text-emerald-500 font-black uppercase opacity-60">VECTOR LOCK</div>
                    <span class="text-2xl font-black text-white font-mono tracking-tighter leading-none">${formattedYards}</span>
                    <span class="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-1">YARDS</span>
                    <div class="absolute bottom-1 right-1 text-[6px] text-gray-600 font-mono">GEO_FIX</div>
                </div>
            `;
        }

        // Adjust camera briefly to see both points perfectly
        const group = new L.featureGroup([mapMarkers[0], mapMarkers[1]]);
        orbitalMap.fitBounds(group.getBounds().pad(0.2));
    }

    function clearMapMeasurements() {
        // Wipe Visuals from memory
        if (orbitalMap) {
            mapMarkers.forEach(m => orbitalMap.removeLayer(m));
            if (mapPolyline) orbitalMap.removeLayer(mapPolyline);
            if (mapLabelMarker) orbitalMap.removeLayer(mapLabelMarker);
        }
        mapMarkers = [];
        mapPolyline = null;
        mapLabelMarker = null;
        document.getElementById('live-map-dist').textContent = "--.--";

        // Reset Minimized View Back to Idle State
        const minimized = document.getElementById('geo-minimized-view');
        if (minimized) {
            minimized.innerHTML = `
                <div class="text-center">
                    <i data-lucide="ruler" class="w-6 h-6 text-gray-700 mx-auto mb-1 group-hover:text-emerald-600"></i>
                    <p class="text-[8px] font-mono text-gray-500 uppercase tracking-[0.2em]">ENGAGE GEO MATRIX</p>
                </div>
            `;
            if(window.lucide) lucide.createIcons();
        }
    }

    // Toolbar Wire-Ups
    const gpsBtn = document.getElementById('geo-live-gps-btn');
    if (gpsBtn) { gpsBtn.addEventListener('click', (e) => { e.stopPropagation(); syncMapToGps(); }); }

    const clearMapBtn = document.getElementById('geo-clear-map-btn');
    if (clearMapBtn) { clearMapBtn.addEventListener('click', (e) => { e.stopPropagation(); clearMapMeasurements(); }); }

    // Master Snapshot Bridge Button (Window 3 to Window 4)
    const mapSnapBtn = document.getElementById('geo-snapshot-btn');
    if (mapSnapBtn) {
        mapSnapBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            const originalHtml = mapSnapBtn.innerHTML;
            mapSnapBtn.innerHTML = `<span class="animate-pulse">📸 RENDERING...</span>`;
            mapSnapBtn.disabled = true;

            try {
                // Capture JUST the full map workplace specifically including footer readout
                const target = document.getElementById('geo-measure-stage');
                
                // Apply a quick forced background inline style just to be ultra-sure
                target.style.background = '#030712';

                const canvas = await html2canvas(target, {
                    useCORS: true,
                    scale: 2, // DOUBLE density for crystal clarity on text
                    backgroundColor: '#030712',
                    logging: false,
                    allowTaint: true,
                    // Explicitly set width/height to current visible state
                    width: target.clientWidth,
                    height: target.clientHeight,
                    onclone: (clonedDoc) => {
                        // Force cloned text to display strongly in clone before snapshot
                        const distSpan = clonedDoc.getElementById('live-map-dist');
                        if(distSpan) {
                            distSpan.style.color = "#ffffff";
                            distSpan.style.fontSize = "14px";
                            distSpan.style.fontWeight = "bold";
                        }
                    }
                });
                
                const dataUri = canvas.toDataURL('image/jpeg', 0.9);
                
                // Deliver directly to Vault system
                saveIntelSnapshot("Orbital_Vector_" + Date.now().toString().slice(-4), dataUri);
                
                mapSnapBtn.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> SAVED TO VAULT`;
                setTimeout(() => { mapSnapBtn.innerHTML = originalHtml; mapSnapBtn.disabled = false; if(window.lucide) lucide.createIcons(); }, 2000);
            } catch (err) {
                console.error(err);
                mapSnapBtn.innerHTML = `❌ FAIL`;
                setTimeout(() => { mapSnapBtn.innerHTML = originalHtml; mapSnapBtn.disabled = false; if(window.lucide) lucide.createIcons(); }, 2000);
            }
            if(window.lucide) lucide.createIcons();
        });
    }


    // ========================================================================
    // WINDOW 4: INTEL VAULT SYSTEM (UPGRADED TO INDEXEDDB PERMANENCE)
    // ========================================================================
    let vaultCache = [];

    // ASYNC INITIALIZATION
    async function initVaultFromDB() {
        if (!window.TRC_IDB) return;
        try {
            // First, migrate any legacy data from LocalStorage
            const legacyData = localStorage.getItem('TRC_INTEL_VAULT');
            if (legacyData) {
                const legacy = JSON.parse(legacyData);
                for (const item of legacy) {
                    await TRC_IDB.set('intelVault', item.id.toString(), item);
                }
                localStorage.removeItem('TRC_INTEL_VAULT');
                window.pushTacLog("MIGRATED VAULT TO PERMANENT DB", "SUCCESS");
            }

            const dbItems = await TRC_IDB.getAll('intelVault');
            vaultCache = Object.values(dbItems).sort((a, b) => {
                const tsA = new Date(a.timestamp).getTime();
                const tsB = new Date(b.timestamp).getTime();
                return tsB - tsA;
            });
            refreshVaultGrid();
        } catch (err) {
            console.error("[VAULT] DB Load Error:", err);
            window.pushTacLog("VAULT DB READ ERROR", "ERROR");
        }
    }
    initVaultFromDB();

    async function saveIntelSnapshot(label, dataUri, metadata = {}) {
        if (vaultCache.length >= 50) { // Increased limit for IDB
            alert("INTEL VAULT IS AT CAPACITY (50/50). PLEASE DELETE OLD INTEL.");
            return;
        }

        const activeDistEl = document.getElementById('live-map-dist');
        const activeDist = (activeDistEl && activeDistEl.textContent !== "--.--") ? activeDistEl.textContent : null;

        const entry = {
            id: Date.now(),
            label: label,
            timestamp: new Date().toISOString(),
            image: dataUri,
            distance: activeDist,
            ...metadata
        };
        
        vaultCache.unshift(entry);
        
        if (window.TRC_IDB) {
            await TRC_IDB.set('intelVault', entry.id.toString(), entry);
        }
        
        refreshVaultGrid();
    }

    function refreshVaultGrid() {
        const container = document.getElementById('vault-list-injection');
        if (!container) return;
        container.innerHTML = '';

        if (vaultCache.length === 0) {
            container.innerHTML = `<div class="col-span-full p-10 text-center border border-dashed border-gray-800 text-gray-600 font-mono text-xs uppercase">
                Vault Encrypted & Empty.<br>Capture snap from map or feeds first.
            </div>`;
            return;
        }

        vaultCache.forEach(item => {
            const el = document.createElement('div');
            el.className = "bg-gray-900 border border-gray-800 rounded hover:border-emerald-500 transition-all p-1 cursor-pointer group relative overflow-hidden";
            el.innerHTML = `
                <div class="aspect-square bg-black overflow-hidden relative border border-gray-800 mb-1 flex items-center justify-center">
                    <img src="${item.image}" class="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-all">
                </div>
                <div class="text-[7px] font-mono text-gray-400 uppercase truncate pr-4">${item.label}</div>
                <div class="text-[6px] text-gray-600">${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                
                <!-- Export Checkbox Overlay: LOCKED VISIBLE ON MOBILE -->
                <div class="absolute top-1.5 left-1.5 z-30 bg-black/60 p-1 rounded">
                    <input type="checkbox" class="vault-export-checkbox w-4 h-4 cursor-pointer" data-vault-id="${item.id}" title="Mark for Export">
                </div>

                <!-- Trash Icon Button Overlay: LOCKED VISIBLE ON MOBILE -->
                <button class="delete-vault-btn absolute top-1.5 right-1.5 bg-red-950/90 text-red-300 p-1.5 rounded border border-red-700 shadow-lg hover:bg-red-600 hover:text-white transition-all z-30" title="Delete Snapshot">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>

                ${item.remarksText ? `
                <button class="load-note-btn absolute bottom-7 right-1.5 bg-yellow-600 text-black p-1.5 rounded border border-yellow-400 shadow-lg hover:bg-yellow-400 transition-all z-30" title="Load to Notepad">
                    <i data-lucide="edit-3" class="w-3 h-3"></i>
                </button>
                ` : ''}
            `;
            
            // Bind the entire card to selection
            el.addEventListener('click', (e) => {
                // If they clicked the trash or checkbox or load-note specifically, don't maximize
                if(e.target.closest('.delete-vault-btn') || e.target.closest('.vault-export-checkbox') || e.target.closest('.load-note-btn')) return;
                e.stopPropagation();
                selectVaultItem(item);
            });

            // Bind Load Note handler
            const loadBtn = el.querySelector('.load-note-btn');
            if(loadBtn) {
                loadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    loadNoteBackToEditor(item);
                });
            }

            // Bind delete handler specific to this card
            const delBtn = el.querySelector('.delete-vault-btn');
            if(delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteVaultEntry(item.id);
                });
            }

            container.appendChild(el);
        });
        if(window.lucide) lucide.createIcons();
    }

    async function deleteVaultEntry(id) {
        if(!confirm("PERMANENTLY WIPE THIS INTEL FROM CACHE?")) return;
        
        vaultCache = vaultCache.filter(x => x.id !== id);
        if (window.TRC_IDB) {
            await TRC_IDB.delete('intelVault', id.toString());
        }
        refreshVaultGrid();
    }

    function selectVaultItem(item) {
        // BROADCAST TO TICKER
        window.pushTacLog(`INTEL VAULT ACCESS: RELOADING SAVED SNAPSHOT`, "SYS");

        const target = document.getElementById('vault-active-display');
        if (!target) return;

        // 1. Populate Target Visualizer (Window 4)
        target.innerHTML = `
            <div class="w-full h-full relative bg-black overflow-hidden flex items-center justify-center">
                <img src="${item.image}" class="w-full h-full object-contain">
                <div class="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>
                <div class="absolute bottom-1 left-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500 text-[7px] font-mono text-emerald-300 uppercase tracking-widest opacity-90 z-10">
                    ${item.label}
                </div>
                
                <!-- Non-Destructive Unload Actuator -->
                <div class="absolute top-1 right-1 flex gap-1 z-50">
                    ${item.remarksText ? `
                    <button class="bg-yellow-600 text-black border border-yellow-400 p-1.5 rounded hover:bg-yellow-400 transition-all shadow-lg flex items-center gap-1 font-black text-[7px]" onclick="event.stopPropagation(); window.loadNoteBackToEditor(JSON.parse(atob('${btoa(JSON.stringify(item))}')))" title="Load back to Notepad">
                        <i data-lucide="edit-3" class="w-2.5 h-2.5"></i> LOAD TO NOTEPAD
                    </button>
                    ` : ''}
                    <button class="bg-red-950/90 text-red-300 border border-red-600/50 p-1.5 rounded hover:bg-red-600 hover:text-white transition-all shadow-lg" onclick="event.stopPropagation(); window.unloadDashboardCard(4)" title="Unload Vault Item">
                        <i data-lucide="trash-2" class="w-2.5 h-2.5"></i>
                    </button>
                </div>
            </div>
        `;
        
        if(window.lucide) lucide.createIcons();

        // 2. DYNAMIC WINDOW 3 POPULATION (GEO MATRIX SYNC)
        const geoMinView = document.getElementById('geo-minimized-view');
        const geoLoadedReadout = document.getElementById('geo-loaded-readout');
        const geoLoadedDist = document.getElementById('geo-loaded-dist');
        const geoRefLabel = document.getElementById('geo-loaded-ref');

        if (geoMinView && geoLoadedReadout && geoLoadedDist) {
            let finalDist = item.distance;

            if (finalDist) {
                geoLoadedDist.textContent = finalDist;
                if(geoRefLabel) geoRefLabel.textContent = `REF_${item.id.toString().substr(-4)}`;
                
                // Reveal the live projection display
                geoMinView.style.display = 'none';
                geoLoadedReadout.classList.remove('hidden');
                geoLoadedReadout.classList.add('flex');
            } else {
                // IF NO DISTANCE PRE-SAVED: INITIATE MACHINE VISION OCR SCAN!
                geoMinView.style.display = 'none';
                geoLoadedReadout.classList.remove('hidden');
                geoLoadedReadout.classList.add('flex');
                geoLoadedDist.innerHTML = `<span class="animate-pulse text-[10px] text-emerald-400 tracking-widest font-black">SCAN_AI</span>`;
                if(geoRefLabel) geoRefLabel.textContent = "ANALYZE_TGT";

                if (typeof Tesseract !== "undefined") {
                    Tesseract.recognize(item.image, 'eng')
                        .then(({ data: { text } }) => {
                            // AI CLEANING ROUTINE: Lowercase and clean standard OCR noise
                            const cleanText = text.toUpperCase().replace(/\s+/g, ' '); 
                            console.log("AI RAW READ:", cleanText);

                            // 1. TARGETED SCAN: Look for Decimals first (e.g., 112.6) 
                            // This is the highest probability match for our measurement tool
                            const decimalMatch = cleanText.match(/\d{2,5}\.\d/);
                            
                            // 2. FALLBACK SCAN: Context-aware integers between 20 and 3000 yards
                            const allNumbers = cleanText.match(/\d{2,5}/g) || [];
                            const validIntegers = allNumbers.filter(n => parseInt(n) > 20 && parseInt(n) < 3000);

                            let foundVal = null;

                            if (decimalMatch) {
                                foundVal = decimalMatch[0]; // PERFECT LOCK
                            } else if (validIntegers.length > 0) {
                                // Use the first robust integer match instead of noise
                                foundVal = validIntegers[0]; 
                            }

                            if(foundVal) {
                                geoLoadedDist.innerHTML = foundVal;
                                if(geoRefLabel) geoRefLabel.textContent = `REF_${item.id.toString().substr(-4)}`;
                                
                                // CACHE SECURELY
                                const index = vaultCache.findIndex(x => x.id === item.id);
                                if (index !== -1) {
                                    vaultCache[index].distance = foundVal;
                                    localStorage.setItem('TRC_INTEL_VAULT', JSON.stringify(vaultCache));
                                }
                            } else {
                                // Fallback to existing Smart Label Extractor if OCR failed
                                const fallback = item.label.match(/\d{2,4}/);
                                geoLoadedDist.textContent = fallback ? fallback[0] : "ERR";
                            }
                        })
                        .catch(e => { geoLoadedDist.textContent = "---"; });
                } else {
                    const fallback = item.label.match(/\d{2,4}/);
                    geoLoadedDist.textContent = fallback ? fallback[0] : "---";
                }
            }
        }

        // 3. ACTIVATE MANUAL OVERRIDE TOUCH LISTENER
        const touchZone = document.getElementById('geo-vector-touch-zone');
        if (touchZone) {
            // Clone node to wipe previous listeners instantly 
            const newTouchZone = touchZone.cloneNode(true);
            touchZone.parentNode.replaceChild(newTouchZone, touchZone);
            
            newTouchZone.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentVal = document.getElementById('geo-loaded-dist').textContent;
                const override = prompt("🔐 MANUAL OVERRIDE: Enter Confirmed Yardage Vector:", currentVal);
                
                if (override !== null && override.trim() !== "") {
                    const cleanVal = override.replace(/[^\d.]/g, ''); // Keep only digits/dots
                    if(cleanVal) {
                        // Immediate visual update
                        document.getElementById('geo-loaded-dist').textContent = cleanVal;
                        
                        // Force update current item and database forever!
                        const idx = vaultCache.findIndex(x => x.id === item.id);
                        if (idx !== -1) {
                            vaultCache[idx].distance = cleanVal;
                            localStorage.setItem('TRC_INTEL_VAULT', JSON.stringify(vaultCache));
                            console.log("VECTOR CACHE UPDATED MANUALLY:", cleanVal);
                        }
                    }
                }
            });
        }

        // Close selector to show maximized snapshot
        window.toggleFullscreen('panel-vault');
    }


    // ========================================================================
    // CENTRAL HUB: DUAL SURVEILLANCE CAMERA ENGINE
    // ========================================================================
    let activeStream = null;
    let currentFacingMode = "environment"; // Start with rear cam

    const activateBtn = document.getElementById('feed-activate-btn');
    const switchBtn = document.getElementById('feed-switch-cam-btn');
    const killBtn = document.getElementById('feed-kill-btn');
    const videoEl = document.getElementById('surveillance-stream');
    const hud = document.getElementById('surveillance-hud');
    const placeholder = document.getElementById('surveillance-placeholder');
    const label = document.getElementById('feed-label-source');

    // --- TACTICAL HUD SENSOR LOGIC ---
    let hudAnimationId = null;
    let currentHudHeading = 0;
    let currentHudPitch = 0;
    let deviceOrientationActive = false;

    let absoluteFired = false;
    function handleOrientation(e) {
        if (e.type === 'deviceorientationabsolute') {
            absoluteFired = true;
        } else if (e.type === 'deviceorientation' && absoluteFired) {
            // Ignore relative events if we are getting absolute ones
            return;
        }

        deviceOrientationActive = true; 
        
        let heading = e.webkitCompassHeading;
        if (heading === undefined || heading === null) {
            heading = 360 - e.alpha; // Android alpha CCW compensation
        }
        if (heading === null || heading === undefined || isNaN(heading)) heading = 0;
        
        // Adjust for device screen orientation (landscape vs portrait)
        let screenAngle = 0;
        if (window.screen && window.screen.orientation) {
            screenAngle = window.screen.orientation.angle || 0;
        } else if (typeof window.orientation !== "undefined") {
            screenAngle = window.orientation || 0;
        }
        
        heading = (heading + screenAngle) % 360;
        if (heading < 0) heading += 360;
        
        let pitch = e.beta;
        if (pitch === null || pitch === undefined) pitch = 0;

        currentHudHeading = heading;
        currentHudPitch = pitch - 90;
    }

    function updateTacticalHUD() {
        if (!deviceOrientationActive) {
            // Mock test animation for PC testing
            currentHudHeading = (currentHudHeading + 0.2) % 360;
            currentHudPitch = Math.sin(Date.now() / 1500) * 15;
        }

        // 1. Compass Update
        const compassValue = document.getElementById('hud-compass-value');
        const compassTape = document.getElementById('hud-compass-tape');
        if (compassValue) {
            const dirs = ["N","NE","E","SE","S","SW","W","NW","N"];
            const ord = dirs[Math.round(((currentHudHeading % 360) / 45))];
            compassValue.textContent = Math.round(currentHudHeading).toString().padStart(3, '0') + '° ' + ord;
        }
        if (compassTape) {
            if (!compassTape.innerHTML.includes('E')) {
                let tapeStr = "";
                for (let i = 0; i <= 360; i += 15) {
                    let dir = i;
                    if (i === 0 || i === 360) dir = 'N';
                    else if (i === 90) dir = 'E';
                    else if (i === 180) dir = 'S';
                    else if (i === 270) dir = 'W';
                    tapeStr += `<span class="inline-block w-8 text-center">${dir}</span>`;
                }
                compassTape.innerHTML = tapeStr + tapeStr + tapeStr; // Extra buffer
            }
            // Approx 32px per 15 degrees = 2.13px per degree
            const offset = (currentHudHeading * (32/15));
            compassTape.style.transform = `translateX(-${offset}px)`;
        }

        // 2. Pitch Inclinometer Update
        const pitchAngle = document.getElementById('hud-pitch-angle');
        const pitchCos = document.getElementById('hud-pitch-cos');
        const pitchLadder = document.getElementById('hud-pitch-ladder');
        
        let p = Math.round(currentHudPitch);
        if (pitchAngle) pitchAngle.textContent = `A: ${Math.abs(p)}° ${p > 0 ? 'UP' : (p < 0 ? 'DN' : '')}`;
        if (pitchCos) {
            let cosVal = Math.cos(p * Math.PI / 180);
            pitchCos.textContent = `C: ${cosVal.toFixed(2)}`;
        }
        if (pitchLadder) {
            if (!pitchLadder.innerHTML.includes('div')) {
                let ladStr = "";
                for(let i=45; i>=-45; i-=5) {
                    if (i===0) ladStr += `<div class="h-6 flex items-center justify-end w-full"><div class="w-full h-[1px] bg-emerald-400"></div></div>`;
                    else ladStr += `<div class="h-6 flex items-center justify-end w-full gap-1"><span class="text-[5px] text-emerald-500">${Math.abs(i)}</span><div class="w-2/3 h-[1px] bg-emerald-500/50"></div></div>`;
                }
                pitchLadder.innerHTML = ladStr;
            }
            // 24px height per 5 degrees = 4.8px per degree
            const pOffset = (currentHudPitch * 4.8);
            pitchLadder.style.transform = `translateY(${pOffset}px)`;
        }

        hudAnimationId = requestAnimationFrame(updateTacticalHUD);
    }

    function initTacticalHUD() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
            setTimeout(() => {
                if (currentHudHeading === 0 && currentHudPitch === -90) {
                    deviceOrientationActive = false; // PC mock fallback
                } else {
                    deviceOrientationActive = true;
                }
            }, 500);
        } else {
            deviceOrientationActive = false;
        }
        hudAnimationId = requestAnimationFrame(updateTacticalHUD);
    }

    function stopTacticalHUD() {
        if (hudAnimationId) cancelAnimationFrame(hudAnimationId);
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
        window.removeEventListener('deviceorientation', handleOrientation, true);
    }
    // --- END TACTICAL HUD SENSOR LOGIC ---

    async function startFeed() {
        if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
        }

        try {
            const constraints = {
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            activeStream = stream;
            videoEl.srcObject = stream;
            
            // Hard kick start for mobile auto-play security!
            try {
                await videoEl.play();
            } catch (playErr) {
                console.warn("Autoplay prevented, retrying with direct call", playErr);
                videoEl.play(); // Fire-and-forget fallback
            }
            
            videoEl.classList.remove('hidden');
            placeholder.classList.add('hidden');
            hud.classList.remove('hidden');
            if(killBtn) killBtn.classList.remove('hidden'); // Show shutdown button
            
            // FORCE SURVEILLANCE FOOTER VISIBLE ON START (Mobile Fix)
            const survFooter = document.getElementById('surveillance-footer');
            if(survFooter) survFooter.classList.remove('hidden');

            label.textContent = currentFacingMode === "environment" ? "REAR CAM" : "SCOPE CAM / FRONT";
            
            initTacticalHUD(); // START HUD LOGIC
            
        } catch (err) {
            console.error("Camera failed:", err);
            alert("Camera Access Denied. Ensure site permissions allow camera access.");
        }
    }

    function stopFeed() {
        if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
            activeStream = null;
        }
        if (videoEl) {
            videoEl.srcObject = null;
            videoEl.classList.add('hidden');
        }
        
        placeholder.classList.remove('hidden');
        hud.classList.add('hidden');
        if(killBtn) killBtn.classList.add('hidden'); // Hide shutdown button again
        
        // HIDE FOOTER ON STOP
        const survFooter = document.getElementById('surveillance-footer');
        if(survFooter) survFooter.classList.add('hidden');
        
        stopTacticalHUD(); // STOP HUD LOGIC

        label.textContent = "OFFLINE";
    }

    if (activateBtn) {
        activateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startFeed();
        });
    }

    if (killBtn) {
        killBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            stopFeed();
        });
    }

    if (switchBtn) {
        switchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
            if (activeStream) startFeed(); // Only start if they already triggered it
        });
    }

    // STREAM CAPTURE LOGIC (Push current frame directly to Vault Window 4)
    const captureBtn = document.getElementById('surveillance-capture-btn');
    if (captureBtn) {
        captureBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!videoEl || videoEl.paused || videoEl.ended) return;

            // Render current video frame to internal canvas
            const canvas = document.createElement('canvas');
            canvas.width = videoEl.videoWidth || 640;
            canvas.height = videoEl.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            
            // --- TACTICAL HUD FULL GRAPHIC BURN-IN ---
            // Dynamic scaler: Mobile cameras are high resolution (1080p+), so we must scale the UI up to match
            const scale = Math.max(1, canvas.width / 400); 
            ctx.scale(scale, scale);
            
            const cw = canvas.width / scale;
            const ch = canvas.height / scale;
            
            ctx.lineWidth = 1;
            const cx = cw / 2;
            const cy = ch / 2;
            
            // 1. Center Reticle
            ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
            ctx.beginPath();
            ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy); // Horizontal cross
            ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20); // Vertical cross
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2); // Center circle
            ctx.stroke();
            
            // Gather live HUD strings
            const tAng = document.getElementById('hud-pitch-angle')?.textContent || "A: --°";
            const tCos = document.getElementById('hud-pitch-cos')?.textContent || "C: 1.00";
            const tTmp = document.getElementById('hud-tel-temp')?.textContent || "--°";
            const tDa = document.getElementById('hud-tel-da')?.textContent || "--";
            const tBaro = document.getElementById('hud-tel-baro')?.textContent || "--";
            const tHumi = document.getElementById('hud-tel-humi')?.textContent || "--";
            const tWnd = document.getElementById('hud-tel-wind')?.textContent || "--";
            const tElev = document.getElementById('hud-dope-elev')?.textContent || "--";
            const tHold = document.getElementById('hud-dope-hold')?.textContent || "--";
            const tRng = document.getElementById('hud-dope-rng')?.textContent || "--";
            
            ctx.font = "bold 12px monospace";
            
            // 2. Dynamic Compass Tape (Top)
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(cx - 100, 15, 200, 25);
            ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
            ctx.strokeRect(cx - 100, 15, 200, 25);
            
            ctx.beginPath();
            ctx.rect(cx - 100, 15, 200, 25);
            ctx.clip(); // Clip drawing to inside the box
            
            ctx.fillStyle = "#34d399";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            
            const pxPerDeg = 3;
            const centerDeg = typeof currentHudHeading !== 'undefined' ? currentHudHeading : 0;
            
            for (let i = -40; i <= 40; i++) {
                const deg = Math.round(centerDeg + i);
                const normalizedDeg = (deg + 360) % 360;
                const x = cx + (i * pxPerDeg);
                
                if (normalizedDeg % 15 === 0) {
                    ctx.fillRect(x - 0.5, 30, 1, 10); // Tick mark
                    let label = normalizedDeg.toString();
                    if (normalizedDeg === 0) label = "N";
                    if (normalizedDeg === 90) label = "E";
                    if (normalizedDeg === 180) label = "S";
                    if (normalizedDeg === 270) label = "W";
                    ctx.fillText(label, x, 26);
                } else if (normalizedDeg % 5 === 0) {
                    ctx.fillRect(x - 0.5, 35, 1, 5); // Minor tick
                }
            }
            ctx.restore();
            
            // Center pointer for compass
            ctx.fillStyle = "#10b981";
            ctx.beginPath();
            ctx.moveTo(cx - 4, 40); ctx.lineTo(cx + 4, 40); ctx.lineTo(cx, 35); ctx.fill();
            
            ctx.font = "bold 12px monospace";
            
            // 3. Pitch Inclinometer (Right)
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(cw - 65, cy - 40, 60, 80);
            ctx.strokeRect(cw - 65, cy - 40, 60, 80);
            ctx.textAlign = "right";
            ctx.fillStyle = "#34d399";
            ctx.fillText(tAng, cw - 12, cy - 20);
            ctx.fillText(tCos, cw - 12, cy);
            
            // 4. Telemetry Block (Bottom Left)
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(15, ch - 105, 140, 90);
            ctx.strokeRect(15, ch - 105, 140, 90);
            ctx.textAlign = "left";
            ctx.fillStyle = "#10b981";
            ctx.font = "bold 10px monospace";
            ctx.fillText("ATMOSPHERIC TELEMETRY", 20, ch - 90);
            ctx.beginPath(); ctx.moveTo(15, ch - 85); ctx.lineTo(155, ch - 85); ctx.stroke();
            
            ctx.fillStyle = "#34d399";
            ctx.fillText(`TEMP: ${tTmp}`, 20, ch - 70);
            ctx.fillText(`PRES: ${tBaro}`, 20, ch - 57);
            ctx.fillText(`HUMI: ${tHumi}`, 20, ch - 44);
            ctx.fillText(`WIND: ${tWnd}`, 20, ch - 31);
            ctx.fillStyle = "#10b981";
            ctx.fillText(`D.A.: ${tDa}`, 20, ch - 18);
            
            // 5. Active DOPE Block (Bottom Right)
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(cw - 115, ch - 85, 100, 70);
            ctx.strokeRect(cw - 115, ch - 85, 100, 70);
            ctx.textAlign = "right";
            ctx.fillStyle = "#10b981";
            ctx.fillText("ACTIVE DOPE", cw - 20, ch - 70);
            ctx.beginPath(); ctx.moveTo(cw - 115, ch - 65); ctx.lineTo(cw - 15, ch - 65); ctx.stroke();
            
            ctx.fillStyle = "#34d399";
            ctx.fillText(`ELEV: ${tElev}`, cw - 20, ch - 50);
            ctx.fillText(`HOLD: ${tHold}`, cw - 20, ch - 37);
            ctx.fillStyle = "#10b981";
            ctx.fillText(`RNG: ${tRng}`, cw - 20, ch - 24);
            
            // Time Stamp
            const dateStr = new Date().toISOString().replace('T', ' ').slice(0, 19) + "Z";
            ctx.textAlign = "center";
            ctx.font = "10px monospace";
            ctx.fillStyle = "rgba(52, 211, 153, 0.6)";
            ctx.fillText(dateStr, cx, ch - 15);
            // --- END BURN-IN ---
            
            // Get Base64
            const shotData = canvas.toDataURL('image/jpeg', 0.85);
            
            // Flash HUD for visceral feedback
            hud.classList.add('bg-white/40');
            setTimeout(() => hud.classList.remove('bg-white/40'), 100);

            // Save Directly to Window 4
            saveIntelSnapshot("Stream_Capture_" + Date.now().toString().slice(-4), shotData);
        });
    }


    // ========================================================================
    // TACTICAL BALLISTICS SOLVER MATRIX ENGINE
    // ========================================================================
    // THROTLED TICKER LOG FOR SOLVER SPAM PROTECTION
    let solverLogThrottle = null;

    function runSolverMatrix() {
        // 0. Inform Ticker of live processing (Debounced once per 3s during fast typing)
        if (!solverLogThrottle) {
            window.pushTacLog("PARAMETERS MODIFIED -> RE-SOLVING BALLISTIC MATRIX...", "INFO");
            solverLogThrottle = setTimeout(() => { solverLogThrottle = null; }, 3000);
        }

        // 1. GATHER ALL INPUTS (HARDWARE, AMMO, ENVIRONMENT, ANGLE)
        let rawRangeYds = parseFloat(document.getElementById('bal-input-range')?.value) || 100;
        const windMph = parseFloat(document.getElementById('bal-input-wind')?.value) || 0;
        const mv = parseFloat(document.getElementById('bal-input-mv')?.value) || 2600;
        const bc = parseFloat(document.getElementById('bal-input-bc')?.value) || 0.5;
        const sightHgt = parseFloat(document.getElementById('bal-input-sh')?.value) || 1.5; 
        const zeroYds = parseFloat(document.getElementById('bal-input-zr')?.value) || 100;

        // ENVIRONMENTALS
        const altitude = parseFloat(document.getElementById('bal-input-alt')?.value) || 0;
        const tempF = parseFloat(document.getElementById('bal-input-temp')?.value) || 59;
        const baroInHg = parseFloat(document.getElementById('bal-input-baro')?.value) || 29.92;

        // INCLINE (SLANT RANGE PHYSICS)
        const lookAngle = parseFloat(document.getElementById('bal-input-angle')?.value) || 0;
        const inputCosEl = document.getElementById('bal-input-cos');
        let inputCosine = parseFloat(inputCosEl?.value);
        // Absolute protection from division-by-zero and zero-fill visual glitches.
        // If the field is 0 or blank, we definitively treat the vector scalar as 1.0 and visual-sync the box.
        if (isNaN(inputCosine) || inputCosine === 0) {
            inputCosine = 1.0;
            if (inputCosEl) inputCosEl.value = "1.00"; 
        }
        
        // The True Range is mathematically shorthand for Horizontal Component relative to Gravity
        // Apply cosine reduction to the physical distance gravity operates across
        const effectiveRangeYds = rawRangeYds * inputCosine;

        if (effectiveRangeYds <= 0) return;
        
        // PROTECTIVE THRESHOLD: Avoid compute lockups/unstable iterations during live user typing
        if (mv < 100) return; 

        // 2. HIGH-FIDELITY AIR DENSITY (UNIFIED STATION PRESSURE PHYSICS)
        // Unified with Telemetry dashboard: Since inputs are labeled and processed as native STATION 
        // pressure, we omit the redundant altitude-scaling factor to prevent mathematical double-derating.
        const pressRatio = baroInHg / 29.92;
        const tempRatio = 518.67 / (459.67 + tempF);
        const airDensityRatio = pressRatio * tempRatio;

        // Calculate and display Density Altitude (DA) for user transparency
        const densityAltitude = (1 - Math.pow(airDensityRatio, 1 / 4.25588)) / 0.0000068753;
        const daDisplay = document.getElementById('bal-display-da');
        if (daDisplay) daDisplay.textContent = Math.round(densityAltitude) + " ft";

        // 3. THE ENGINE: MULTI-STEP NUMERICAL PROPAGATION (4-Phase Mach Dynamics)
        const gravity = 32.174; 
        const speedOfSound = 49.02 * Math.sqrt(tempF + 459.67); // Exact acoustic limit for air temp

        function simulateTrajectory(targetYards) {
            const targetFt = targetYards * 3;
            
            // =====================================================================
            // HIGH-FIDELITY INDUSTRY-STANDARD G1 BALLISTIC PROPAGATOR
            // Utilizing the verified Continuous Piecewise Power Data Array
            // =====================================================================
            const G1 = {
                T: [4230, 3680, 3450, 3295, 3130, 2960, 2830, 2680, 2460, 2225, 2015, 1890, 1810, 1730, 1595, 1520, 1420, 1360, 1315, 1280, 1220, 1185, 1150, 1100, 1060, 1025, 980, 945, 905, 860, 810, 780, 750, 700, 640, 600, 550, 250, 100, 65, 0],
                V: [ 
                    {A:1.4774e-04, M:1.9565}, {A:1.9203e-04, M:1.9250}, {A:2.8948e-04, M:1.8750}, {A:4.3499e-04, M:1.8250}, {A:6.5204e-04, M:1.7750}, {A:9.7481e-04, M:1.7250}, {A:1.4537e-03, M:1.6750}, {A:2.1629e-03, M:1.6250}, {A:3.2096e-03, M:1.5750}, {A:3.9044e-03, M:1.5500}, {A:3.2229e-03, M:1.5750}, {A:2.2033e-03, M:1.6250}, {A:1.5110e-03, M:1.6750}, {A:8.6100e-04, M:1.7500}, {A:4.0861e-04, M:1.8500}, {A:1.9545e-04, M:1.9500}, {A:5.4319e-05, M:2.1250}, {A:8.8477e-06, M:2.3750}, {A:1.4569e-06, M:2.6250}, {A:2.4195e-07, M:2.8750}, {A:1.6580e-08, M:3.2500}, {A:4.7455e-10, M:3.7500}, {A:1.3797e-11, M:4.2500}, {A:4.0702e-13, M:4.7500}, {A:2.9382e-14, M:5.1250}, {A:1.2286e-14, M:5.2500}, {A:2.9169e-14, M:5.1250}, {A:3.8551e-13, M:4.7500}, {A:1.1851e-11, M:4.2500}, {A:3.5661e-10, M:3.7500}, {A:1.0455e-08, M:3.2500}, {A:1.2912e-07, M:2.8750}, {A:6.8244e-07, M:2.6250}, {A:3.5692e-06, M:2.3750}, {A:1.8390e-05, M:2.1250}, {A:5.7112e-05, M:1.9500}, {A:9.2266e-05, M:1.8750}, {A:9.3380e-05, M:1.8750}, {A:7.2252e-05, M:1.9250}, {A:5.7927e-05, M:1.9750}, {A:5.2062e-05, M:2.0000}
                ]
            };

            function retard(velocity) {
                let currentA = -1, currentM = -1;
                for (let i = 0; i < G1.T.length; i++) {
                    if (velocity > G1.T[i]) {
                        currentA = G1.V[i].A;
                        currentM = G1.V[i].M;
                        break;
                    }
                }
                if (currentA === -1) {
                    currentA = G1.V[G1.V.length-1].A;
                    currentM = G1.V[G1.V.length-1].M;
                }
                // Final verified physics retardation computation scaled to specific atmospherics & BC
                return (currentA * Math.pow(velocity, currentM) * airDensityRatio) / bc;
            }

            // ITERATIVE ZERO ANGLE SOLVER
            function getZeroAngle() {
                let angle = 0.0;
                let deltaAngle = Math.PI / 180.0; // 1 degree step
                const targetX = zeroYds * 3.0;
                const startY = -(sightHgt / 12.0); // Start below line of sight
                
                for (let iter = 0; iter < 100; iter++) {
                    let v_x = mv * Math.cos(angle);
                    let v_y = mv * Math.sin(angle);
                    
                    let d_x = 0;
                    let d_y = startY;
                    let dt = 0.0005; // High resolution time step
                    
                    while (d_x <= targetX) {
                        let total_v = Math.sqrt(v_x*v_x + v_y*v_y);
                        let dragAccel = retard(total_v);
                        
                        let ax_drag = -(v_x / total_v) * dragAccel;
                        let ay_drag = -(v_y / total_v) * dragAccel;
                        
                        let v_x_next = v_x + ax_drag * dt;
                        let v_y_next = v_y + (ay_drag - gravity) * dt;
                        
                        d_x += dt * (v_x + v_x_next) / 2.0;
                        d_y += dt * (v_y + v_y_next) / 2.0;
                        
                        v_x = v_x_next;
                        v_y = v_y_next;
                        
                        if (v_x < 10) break;
                    }
                    
                    if (Math.abs(d_y) < 0.0001) break; // Intercept achieved
                    
                    if (d_y > 0) { // Hit high
                        if (deltaAngle > 0) deltaAngle = -deltaAngle / 2.0;
                    } else { // Hit low
                        if (deltaAngle < 0) deltaAngle = -deltaAngle / 2.0;
                    }
                    angle += deltaAngle;
                }
                return angle;
            }

            const zeroAngle = getZeroAngle();

            // MAIN TRAJECTORY INTEGRATION
            let v_x = mv * Math.cos(zeroAngle);   
            let v_y = mv * Math.sin(zeroAngle);    
            let d_x = 0;    
            let d_y = -(sightHgt / 12.0);    
            let t = 0;      
            const dt = 0.0005; 
            
            while (d_x < targetFt) {
                let total_v = Math.sqrt(v_x*v_x + v_y*v_y);
                let dragAccel = retard(total_v);
                
                let ax_drag = -(v_x / total_v) * dragAccel;
                let ay_drag = -(v_y / total_v) * dragAccel;
                
                let v_x_next = v_x + ax_drag * dt;
                let v_y_next = v_y + (ay_drag - gravity) * dt;
                
                d_x += dt * (v_x + v_x_next) / 2.0;
                d_y += dt * (v_y + v_y_next) / 2.0;
                
                v_x = v_x_next;
                v_y = v_y_next;
                t += dt;
                
                // ABSOLUTE SAFETY BREAKERS: Prevent browser lockup on hyper-low velocity collisions
                if (v_x < 10) break; 
                if (t > 10.0) break; // Bullets generally don't fly for 10+ seconds
            }
            
            return { time: t, drop: d_y * 12, finalVel: Math.sqrt(v_x*v_x + v_y*v_y) };
        }

        // 4. COMPUTE SOLUTIONS (Using Effective Slant Range)
        const targetSim = simulateTrajectory(effectiveRangeYds);

        // 5. ZERO-RANGE INTERCEPT VECTOR (Implicitly calculated via iterative zeroAngle solver)
        // If targetSim.drop is POSITIVE, the bullet is hitting HIGH, so we need a DOWN hold (-netDrop)
        // If targetSim.drop is NEGATIVE, the bullet is hitting LOW, so we need an UP hold (+netDrop)
        const netDropInches = -targetSim.drop;

        // 6. UNIFIED WINDAGE & GYROSCOPIC VECTORS (NET DRIFT SUMMATION)
        const windDirDeg = parseFloat(document.getElementById('bal-input-wind-dir')?.value) || 90;
        const shotDirDeg = parseFloat(document.getElementById('bal-input-shot-dir')?.value) || 0;
        
        const relativeAngleDeg = windDirDeg - shotDirDeg;
        const angleRad = relativeAngleDeg * (Math.PI / 180);
        const rawSine = Math.sin(angleRad); 
        
        // Physics: Calculate basic drift magnitude in inches
        const crosswindFps = (windMph * Math.abs(rawSine)) * 1.4667;
        const vacuumTime = (effectiveRangeYds * 3) / mv;
        const baseDriftMag = crosswindFps * (targetSim.time - vacuumTime) * 12;
        
        // Realize vector direction: 
        // Positive (+) implies wind pushes Left -> Requires Right scope correction.
        // Negative (-) implies wind pushes Right -> Requires Left scope correction.
        const windDriftInches = rawSine >= 0 ? baseDriftMag : -baseDriftMag;

        // Calculate high-fidelity Spin Drift (Counter-Clockwise Gyro-Drift)
        // Default physics rule: 0.00018 mils offset per yard.
        const spinDriftMils = effectiveRangeYds * 0.00018;
        const milConstant = effectiveRangeYds * 0.036;
        const spinDriftInches = spinDriftMils * milConstant;
        
        // ALGEBRAIC UNIFICATION: Combine dynamic wind push and static right-hand spin push.
        // Standard spin pushes bullet Right -> Always forces additional Left (-) correction.
        const netDriftInches = windDriftInches - spinDriftInches;

        // Resolve Master Directional Orientation Code based on total Net Vector state
        let directionCode = '-';
        if (netDriftInches > 0.08) directionCode = 'R'; // Trivial threshold
        else if (netDriftInches < -0.08) directionCode = 'L';

        // 7. CONVERT UNIFIED NET VECTOR TO OPTIC UNITS (MILS / MOA)
        const opticMode = window.currentOpticMode || 'MIL';
        
        let opticElevValue = 0;
        let opticWindValue = 0; 
        let finalClicks = 0;
        let windClicks = 0;
        let elevDirectionCode = 'U';

        if (opticMode === 'MIL') {
            opticElevValue = netDropInches / milConstant; 
            opticWindValue = Math.abs(netDriftInches / milConstant);
            
            elevDirectionCode = opticElevValue >= 0 ? 'U' : 'D';
            finalClicks = Math.round(Math.abs(opticElevValue) * 10); 
            windClicks = Math.round(opticWindValue * 10);
        } else {
            // Unified MOA Output
            const moaConstant = effectiveRangeYds * 0.01047;
            opticElevValue = netDropInches / moaConstant;
            opticWindValue = Math.abs(netDriftInches / moaConstant);
            
            elevDirectionCode = opticElevValue >= 0 ? 'U' : 'D';
            finalClicks = Math.round(Math.abs(opticElevValue) * 10); 
            windClicks = Math.round(opticWindValue * 10);
        }

        // 8. ATOMIC DASHBOARD UPDATE
        const elevEl = document.getElementById('sol-elev-mil');
        if(elevEl) elevEl.textContent = Math.abs(opticElevValue).toFixed(2);
        
        const elevInchEl = document.getElementById('sol-elev-inch');
        if(elevInchEl) elevInchEl.textContent = Math.abs(netDropInches).toFixed(1) + '"';
        
        const elevClicksEl = document.getElementById('sol-elev-clicks');
        if(elevClicksEl) elevClicksEl.textContent = `${finalClicks}`;
        
        const elevLabelEl = document.getElementById('sol-elev-label-code');
        if (elevLabelEl) elevLabelEl.textContent = elevDirectionCode;

        const elevUnitEl = document.getElementById('sol-elev-unit');
        if (elevUnitEl) elevUnitEl.textContent = opticMode;

        // Final Windage Synchronization (Unified Net Readouts)
        const windMilEl = document.getElementById('sol-wind-mil');
        if(windMilEl) windMilEl.textContent = opticWindValue.toFixed(2);
        
        const windInchEl = document.getElementById('sol-wind-inch');
        if(windInchEl) windInchEl.textContent = Math.abs(netDriftInches).toFixed(1) + '"';
        
        const windLabelEl = document.getElementById('sol-wind-label-code');
        if (windLabelEl) windLabelEl.textContent = directionCode;
        
        const windClicksEl = document.getElementById('sol-wind-clicks');
        if(windClicksEl) windClicksEl.textContent = `${windClicks}`;

        const windUnitEl = document.getElementById('sol-wind-unit');
        if (windUnitEl) windUnitEl.textContent = opticMode;

        // --- HUD LIVE SYNC ---
        const hTelTemp = document.getElementById('hud-tel-temp');
        if (hTelTemp) hTelTemp.textContent = tempF + '°';
        const hTelBaro = document.getElementById('hud-tel-baro');
        if (hTelBaro) hTelBaro.textContent = baroInHg.toFixed(2);
        const hTelWind = document.getElementById('hud-tel-wind');
        if (hTelWind) hTelWind.textContent = `${windMph} MPH @ ${windDirDeg}°`;
        
        // Approximate DA for HUD (simplified model for visual display)
        // Standard formula: DA = Altitude + 120*(Temp - Standard Temp at Alt)
        const stdTemp = 59 - (0.00356 * altitude);
        const calcDA = Math.round(altitude + 120 * (tempF - stdTemp));
        const hTelDa = document.getElementById('hud-tel-da');
        if (hTelDa) hTelDa.textContent = calcDA;

        const hDopeElev = document.getElementById('hud-dope-elev');
        if (hDopeElev) hDopeElev.textContent = `${elevDirectionCode} ${Math.abs(opticElevValue).toFixed(2)}`;
        const hDopeHold = document.getElementById('hud-dope-hold');
        if (hDopeHold) hDopeHold.textContent = `${directionCode} ${opticWindValue.toFixed(2)}`;
        const hDopeRng = document.getElementById('hud-dope-rng');
        if (hDopeRng) hDopeRng.textContent = `${Math.round(rawRangeYds)} YDS`;
        // --- END HUD LIVE SYNC ---

        const btn = document.getElementById('master-solve-btn');
        if (btn) {
            btn.classList.add('animate-pulse', 'bg-emerald-300', 'text-black');
            setTimeout(() => btn.classList.remove('animate-pulse', 'bg-emerald-300', 'text-black'), 200);
        }
    }

    // === TELEMETRY HOOKS ===
    
    // 1. Sync Range from Map measurement (FIXED & ACTIVATED)
    const syncGeoBtn = document.getElementById('bal-sync-map');
    if (syncGeoBtn) {
        syncGeoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Attempt to fetch live measurement from active session
            const valSpan = document.getElementById('live-map-dist');
            if (valSpan && valSpan.textContent !== "--.--") {
                const dist = Math.round(parseFloat(valSpan.textContent));
                document.getElementById('bal-input-range').value = dist;
                
                syncGeoBtn.textContent = "LOCKED";
                syncGeoBtn.classList.add('bg-emerald-500', 'text-white');
                setTimeout(() => {
                    syncGeoBtn.textContent = "SYNC MAP";
                    syncGeoBtn.classList.remove('bg-emerald-500', 'text-white');
                    runSolverMatrix(); // Instant dynamic solve
                }, 800);
            } else {
                alert("No live map measurement detected! Draw a line on the recon map first.");
            }
        });
    }

    // 2. FULL METEO UPLINK (FIXED, ACTIVATED & EXPANDED)
    const balSyncWxBtn = document.getElementById('bal-sync-wx');
    if (balSyncWxBtn) {
        balSyncWxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Fetch all source nodes from weather telemetry dashboard
            const wxWind = document.getElementById('wx-wind-speed');
            const wxDir = document.getElementById('wx-wind-dir');
            const wxTemp = document.getElementById('wx-temp');
            const wxPres = document.getElementById('wx-pres');

            if (wxWind && wxWind.textContent !== "--") {
                // 1. PULL WIND DATA
                document.getElementById('bal-input-wind').value = Math.round(parseFloat(wxWind.textContent));
                
                // Extract digits from "DEG 128"
                const dirMatch = wxDir.textContent.match(/\d+/);
                if(dirMatch) document.getElementById('bal-input-wind-dir').value = dirMatch[0];

                // 2. PULL CRITICAL ATMOSPHERICS
                if(wxTemp) document.getElementById('bal-input-temp').value = Math.round(parseFloat(wxTemp.textContent));
                if(wxPres) document.getElementById('bal-input-baro').value = parseFloat(wxPres.textContent);
                
                // LOG TO TAC-COMMS
                window.pushTacLog(`METEO UPLINK ESTABLISHED. ATMOSPHERICS INJECTED TO SOLVER.`, "SUCCESS");
                
                // SUCCESS FEEDBACK
                const originalBtnText = balSyncWxBtn.textContent;
                balSyncWxBtn.textContent = "LOCKED";
                balSyncWxBtn.classList.add('bg-emerald-500', 'text-white');
                
                setTimeout(() => { 
                    balSyncWxBtn.textContent = originalBtnText; 
                    balSyncWxBtn.classList.remove('bg-emerald-500', 'text-white');
                    runSolverMatrix(); // Instant complete recalculation
                }, 800);
            } else {
                alert("No orbital climate data available! Click 'SYNC SATELLITE CLIMATE' in the weather panel first.");
            }
        });
    }

    // Angle to Cosine Dynamic Link
    const inputAngle = document.getElementById('bal-input-angle');
    const inputCos = document.getElementById('bal-input-cos');
    if (inputAngle && inputCos) {
        inputAngle.addEventListener('input', () => {
            const deg = parseFloat(inputAngle.value) || 0;
            const rad = deg * (Math.PI / 180);
            inputCos.value = Math.abs(Math.cos(rad)).toFixed(3);
        });
    }

    // Master Trigger Listener
    const solveBtn = document.getElementById('master-solve-btn');
    if (solveBtn) {
        solveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            runSolverMatrix();
        });
    }

    // Optic Mode Toggle Listener
    window.currentOpticMode = 'MIL';
    const modeBtn = document.getElementById('bal-optic-mode-btn');
    if (modeBtn) {
        modeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.currentOpticMode = window.currentOpticMode === 'MIL' ? 'MOA' : 'MIL';
            modeBtn.textContent = `MODE: ${window.currentOpticMode}`;
            
            // Adjust visual state of button
            if (window.currentOpticMode === 'MOA') {
                modeBtn.classList.remove('text-blue-300', 'border-blue-700');
                modeBtn.classList.add('text-orange-300', 'border-orange-700');
            } else {
                modeBtn.classList.remove('text-orange-300', 'border-orange-700');
                modeBtn.classList.add('text-blue-300', 'border-blue-700');
            }
            
            runSolverMatrix();
        });
    }

    // === SYNC DISABLED: Dashboard ballistic solver is fully independent of the range card form ===
    // Each form must be filled in manually by the user.

    // Auto-calculate when any value manually changes
    ['bal-input-range', 'bal-input-shot-dir', 'bal-input-wind', 'bal-input-wind-dir', 'bal-input-mv', 'bal-input-bc', 'bal-input-sh', 'bal-input-zr', 'bal-input-alt', 'bal-input-temp', 'bal-input-baro', 'bal-input-angle', 'bal-input-cos'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', runSolverMatrix);
    });

    // Kickoff initial baseline calculation
    setTimeout(runSolverMatrix, 500);


    // AUTO-EXPAND PANEL ON TAP/CLICK
    document.querySelectorAll('.dash-panel').forEach(panel => {
        // Add a style to suggest interactivity
        panel.style.cursor = 'pointer';
        
        panel.addEventListener('click', (e) => {
            // 1. If it is already maximized, do not toggle it back automatically 
            //    (this allows user to interact with inside content without it closing).
            if (panel.classList.contains('is-maximized')) return;

            // 2. If they clicked a native control/button/input block inside, let that action fire instead of zooming
            if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input') || e.target.closest('.relative.bg-gray-900\\/50')) return;
            
            // EXPLICIT BYPASS: If they click INSIDE the Grid Selectors to load a card, DO NOT trigger auto-zoom container!
            if (e.target.closest('#dope-cache-list-injection') || 
                e.target.closest('#sat-archive-list-injection') || 
                e.target.closest('#vault-list-injection')) {
                return;
            }

            // 3. Otherwise, auto-maximize this panel!
            if (panel.id) {
                window.toggleFullscreen(panel.id);
            }
        });
    });

    // Stabilize Window 3 permanently on application launch
    setTimeout(initLiveMap, 1000);

    // --- VAULT IMPORT / EXPORT LOGIC ---
    const vaultExportBtn = document.getElementById('vault-export-btn');
    const vaultImportBtn = document.getElementById('vault-import-btn');
    const vaultImportInput = document.getElementById('vault-import-input');

    if (vaultExportBtn) {
        vaultExportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const checkedBoxes = document.querySelectorAll('.vault-export-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Please select at least one snapshot to export using the checkboxes.');
                return;
            }

            const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.vaultId);
            const itemsToExport = vaultCache.filter(item => selectedIds.includes(item.id.toString()));

            // Export as native image files
            itemsToExport.forEach((item, index) => {
                setTimeout(() => {
                    const a = document.createElement('a');
                    a.href = item.image; // This is the base64 data URI
                    // Embed metadata directly into the filename so it can be parsed on import
                    const distStr = item.distance ? `${item.distance}yds_` : '';
                    a.download = `trc_snap_${distStr}${item.timestamp}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }, index * 400); // 400ms delay between downloads to prevent browser multi-download blocking
            });
            
            // Uncheck boxes after export
            checkedBoxes.forEach(cb => cb.checked = false);
            window.pushTacLog(`EXPORTED ${itemsToExport.length} NATIVE IMAGES TO SECURE LOCAL STORAGE`, "SUCCESS");
        });
    }

    const vaultChatsBtn = document.getElementById('vault-chats-btn');
    if (vaultChatsBtn) {
        vaultChatsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const checkedBoxes = document.querySelectorAll('.vault-export-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Please select at least one snapshot to send to chats.');
                return;
            }

            const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.vaultId);
            const itemsToSend = vaultCache.filter(item => selectedIds.includes(item.id.toString()));

            itemsToSend.forEach((item, index) => {
                setTimeout(() => {
                    const base64Image = item.image;
                    
                    // Send to network
                    commsChannel.send({
                        type: 'broadcast',
                        event: 'chat',
                        payload: { data: TacticalCrypto.encrypt({ message: "INCOMING IMAGE INTEL", image: base64Image, user: commsUser }) }
                    });
                    
                    // Render locally
                    renderChatMessage(commsUser, "INCOMING IMAGE INTEL", true, base64Image);
                }, index * 500); // Stagger sending
            });
            
            // Uncheck boxes after sending
            checkedBoxes.forEach(cb => cb.checked = false);
            window.pushTacLog(`SENT ${itemsToSend.length} IMAGES TO COMM CHANNEL`, "SUCCESS");
        });
    }

    // --- VAULT TO CACHE LOGIC ---
    const vaultToDopeBtn = document.getElementById('vault-to-dope-btn');
    if (vaultToDopeBtn) {
        vaultToDopeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const checkedBoxes = document.querySelectorAll('.vault-export-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Please select at least one snapshot to send to Dope Cache.');
                return;
            }

            const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.vaultId);
            const itemsToSend = vaultCache.filter(item => selectedIds.includes(item.id.toString()));
            const ps = getProfiles();
            
            const currentDopeCount = Object.keys(ps).filter(k => !ps[k].isReconScenario).length;
            if (currentDopeCount + itemsToSend.length > 20) {
                alert(`LIBRARY FULL: DOPE CACHE HAS CAPACITY FOR ${20 - currentDopeCount} MORE CARDS. PLEASE DELETE OLD CARDS FIRST.`);
                return;
            }
            
            let sortedCount = 0;
            itemsToSend.forEach(item => {
                const defaultName = item.originalName || item.label || 'IMPORTED_DOPE_' + Date.now();
                const name = prompt("Enter a name for this DOPE card:", defaultName);
                if (name) {
                    if (item.originalName) {
                        // RESTORE FULL ORIGINAL FORM DATA FROM VAULT METADATA
                        ps[name] = Object.assign({}, item, {
                            snapshot: item.image,
                            timestamp: item.timestamp || Date.now()
                        });
                    } else {
                        // FALLBACK FOR EXTERNAL IMAGES IMPORTED INTO VAULT
                        ps[name] = {
                            snapshot: item.image,
                            isReconScenario: false,
                            timestamp: item.timestamp || Date.now(),
                            caliber: 'IMPORTED IMG',
                            date: new Date().toLocaleDateString()
                        };
                    }
                    sortedCount++;
                }
            });
            
            if (sortedCount > 0) {
                saveProfiles(ps);
                if (window.refreshDopeCacheGrid) window.refreshDopeCacheGrid();
                window.pushTacLog(`SORTED ${sortedCount} IMAGES TO DOPE CACHE`, "SUCCESS");
            }
            
            // Uncheck boxes
            checkedBoxes.forEach(cb => cb.checked = false);
        });
    }

    const vaultToSatBtn = document.getElementById('vault-to-sat-btn');
    if (vaultToSatBtn) {
        vaultToSatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const checkedBoxes = document.querySelectorAll('.vault-export-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Please select at least one snapshot to send to Sat Archive.');
                return;
            }

            const selectedIds = Array.from(checkedBoxes).map(cb => cb.dataset.vaultId);
            const itemsToSend = vaultCache.filter(item => selectedIds.includes(item.id.toString()));
            const ps = getProfiles();
            
            const reconCount = Object.keys(ps).filter(k => !!ps[k].isReconScenario).length;
            if (reconCount + itemsToSend.length > 20) {
                alert(`LIBRARY FULL: RECON MAP CACHE HAS CAPACITY FOR ${20 - reconCount} MORE MAPS. PLEASE DELETE OLD MAPS FIRST.`);
                return;
            }
            
            let sortedCount = 0;
            itemsToSend.forEach(item => {
                const defaultName = item.originalName || item.label || 'IMPORTED_RECON_' + Date.now();
                const name = prompt("Enter a name for this Recon Map:", defaultName);
                if (name) {
                    if (item.originalName) {
                        ps[name] = Object.assign({}, item, {
                            snapshot: item.image,
                            // Preserve original item.bgImage (clean map) instead of overwriting with the flattened snapshot
                            timestamp: item.timestamp || Date.now()
                        });
                    } else {
                        ps[name] = {
                            snapshot: item.image,
                            bgImage: item.image, // Fallback: use snapshot as background
                            isReconScenario: true,
                            timestamp: item.timestamp || Date.now()
                        };
                    }
                    sortedCount++;
                }
            });
            
            if (sortedCount > 0) {
                saveProfiles(ps);
                if (window.refreshSatArchiveGrid) window.refreshSatArchiveGrid();
                window.pushTacLog(`SORTED ${sortedCount} IMAGES TO SAT ARCHIVE`, "SUCCESS");
            }
            
            // Uncheck boxes
            checkedBoxes.forEach(cb => cb.checked = false);
        });
    }

    // --- CACHE TO VAULT LOGIC ---
    const dopeToVaultBtn = document.getElementById('dope-to-vault-btn');
    if (dopeToVaultBtn) {
        dopeToVaultBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const checkedBoxes = document.querySelectorAll('.dope-vault-checkbox:checked');
            if (checkedBoxes.length === 0) return;

            const profiles = window.getProfiles ? window.getProfiles() : {};
            let sentCount = 0;
            let errCount = 0;

            checkedBoxes.forEach(cb => {
                const name = cb.dataset.profileName;
                const p = profiles[name];
                if (p && p.snapshot) {
                    // Clone profile and ensure name is attached so we don't lose the label
                    const profileMetadata = Object.assign({}, p, { originalName: name });
                    saveIntelSnapshot('DOPE_CARD', p.snapshot, profileMetadata);
                    sentCount++;
                } else {
                    errCount++;
                }
                cb.checked = false; // uncheck
            });

            if (errCount > 0) {
                alert(`Warning: ${errCount} DOPE card(s) could not be sent to Vault because they do not have a snapshot image attached.`);
            }
            if (sentCount > 0) {
                window.pushTacLog(`TRANSFERRED ${sentCount} DOPE CARDS TO SECURE VAULT`, "SUCCESS");
            }
            
            // Re-hide button
            dopeToVaultBtn.classList.add('hidden');
        });
    }

    const satToVaultBtn = document.getElementById('sat-to-vault-btn');
    if (satToVaultBtn) {
        satToVaultBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const checkedBoxes = document.querySelectorAll('.sat-vault-checkbox:checked');
            if (checkedBoxes.length === 0) return;

            const profiles = window.getProfiles ? window.getProfiles() : {};
            let sentCount = 0;
            let errCount = 0;

            checkedBoxes.forEach(cb => {
                const name = cb.dataset.profileName;
                const p = profiles[name];
                const mapSrc = p ? (p.snapshot || p.bgImage) : null;
                
                if (mapSrc) {
                    const profileMetadata = Object.assign({}, p, { originalName: name });
                    saveIntelSnapshot('RECON_MAP', mapSrc, profileMetadata);
                    sentCount++;
                } else {
                    errCount++;
                }
                cb.checked = false; // uncheck
            });

            if (errCount > 0) {
                alert(`Warning: ${errCount} Recon Map(s) could not be sent to Vault because they do not have a snapshot or background image.`);
            }
            if (sentCount > 0) {
                window.pushTacLog(`TRANSFERRED ${sentCount} MAPS TO SECURE VAULT`, "SUCCESS");
            }
            
            // Re-hide button
            satToVaultBtn.classList.add('hidden');
        });
    }

    if (vaultImportBtn && vaultImportInput) {
        vaultImportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            vaultImportInput.click();
        });

        vaultImportInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            let importCount = 0;
            let processed = 0;

            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    
                    // Parse metadata natively from our custom filename structure
                    // Expected format: trc_snap_600yds_168432323.png
                    let distMatch = file.name.match(/(\d+)yds_/);
                    let tsMatch = file.name.match(/_(\d+)\.(png|jpe?g)/i);
                    
                    let distance = distMatch ? parseInt(distMatch[1]) : 0;
                    let timestamp = tsMatch ? parseInt(tsMatch[1]) : Date.now();
                    
                    const newItem = {
                        id: 'import_' + Math.random().toString(36).substr(2, 9),
                        timestamp: timestamp,
                        label: `IMPORTED IMG ${distance ? '@ ' + distance + ' YDS' : ''}`,
                        image: dataUrl,
                        distance: distance
                    };

                    vaultCache.push(newItem);
                    importCount++;
                    processed++;

                    // Once all files are processed into base64 strings
                    if (processed === files.length) {
                        // Re-sort so newest is first
                        vaultCache.sort((a, b) => b.timestamp - a.timestamp);
                        
                        // Enforce cache limit
                        if(vaultCache.length > 50) {
                            vaultCache = vaultCache.slice(0, 50);
                            window.pushTacLog("VAULT CAPACITY (50) REACHED: OLDEST ITEMS OVERWRITTEN", "WARNING");
                        }
                        
                        localStorage.setItem('TRC_INTEL_VAULT', JSON.stringify(vaultCache));
                        refreshVaultGrid();
                        window.pushTacLog(`IMPORTED ${importCount} IMAGES INTO VAULT CACHE`, "SUCCESS");
                        
                        // Reset input
                        vaultImportInput.value = '';
                    }
                };
                reader.readAsDataURL(file); // Read as native image data
            });
        });
    }

    // ========================================================================
    // TACTICAL COMMS LINK: SUPABASE INTEGRATION
    // ========================================================================
    let commsChannel = null;
    let commsUser = null;
    let commsMapInstance = null;
    let teamMarkers = {};
    let geoWatchId = null;

    const connectBtn = document.getElementById('comms-connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            const team = document.getElementById('comms-team').value.trim().toUpperCase();
            const callsign = document.getElementById('comms-callsign').value.trim().toUpperCase();
            const role = document.getElementById('comms-role').value.trim().toUpperCase();
            const passcode = document.getElementById('comms-passcode').value.trim();

            window.pushTacLog(`AUTH ATTEMPT: ${callsign} @ ${team}`, "SYS");

            if (!team || !callsign || !role || !passcode) {
                alert("IDENTITY VERIFICATION FAILED: ALL FIELDS REQUIRED, INCLUDING MISSION CODE.");
                return;
            }

            // === MISSION CODE COMPLEXITY ENFORCEMENT ===
            const letterCount   = (passcode.match(/[a-zA-Z]/g) || []).length;
            const digitCount    = (passcode.match(/[0-9]/g) || []).length;
            const specialCount  = (passcode.match(/[^a-zA-Z0-9]/g) || []).length;

            if (passcode.length < 10) {
                alert("MISSION CODE REJECTED: Minimum 10 characters required.");
                return;
            }
            if (letterCount < 5) {
                alert(`MISSION CODE REJECTED: Requires at least 5 letters. Detected: ${letterCount}`);
                return;
            }
            if (digitCount < 2) {
                alert(`MISSION CODE REJECTED: Requires at least 2 numbers. Detected: ${digitCount}`);
                return;
            }
            if (specialCount < 3) {
                alert(`MISSION CODE REJECTED: Requires at least 3 special characters (e.g. !@#$%). Detected: ${specialCount}`);
                return;
            }
            // ==========================================

            // Lock in the team secret
            localStorage.setItem('trc_team_secret', passcode);
            commsUser = { id: `u_${Date.now()}`, callsign, role, team };

            initSupabaseComms(team, passcode);
        });
    }

    async function initSupabaseComms(teamName, passcode) {
        // Show dashboard immediately for UI verification
        document.getElementById('comms-login').classList.add('hidden');
        document.getElementById('comms-dashboard').classList.remove('hidden');
        document.getElementById('comms-dashboard').classList.add('grid');
        
        // Trigger Lucide icon creation for the new dashboard elements
        if (window.lucide) window.lucide.createIcons();
        
        // Initialize Map
        initCommsMap();

        if (!window.supabase || !window.supabase.createClient) {
            window.pushTacLog("SUPABASE DRIVER MISSING. RUNNING IN LOCAL DEMO MODE.", "ALERT");
            return;
        }

        // Mission-Specific Channel Hashing
        const missionId = btoa(`trc_prod_${teamName}_${passcode}`).replace(/=/g, '');
        const supabaseUrl = 'https://nvnwqcfgpwzheekninle.supabase.co'; // NEEDS USER INPUT
        const supabaseKey = 'sb_publishable_si9fg-bURw3K5yprgAgifw_Eez79zU0'; // NEEDS USER INPUT
        
        if (supabaseUrl.includes('your-project-url')) {
            window.pushTacLog("SUPABASE KEYS NOT CONFIGURED. LOCAL SYNC ONLY.", "SYS");
            return;
        }

        try {
            // Use existing client or create new
            if (!window.supabaseClient) {
                window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            }

        commsChannel = window.supabaseClient.channel(missionId, {
            config: { presence: { key: commsUser.id } }
        });

        // 1. Handle Chat (DECRYPT ON RECEIPT)
        commsChannel.on('broadcast', { event: 'chat' }, (payload) => {
            const dec = TacticalCrypto.decrypt(payload.payload.data);
            if (dec) {
                renderChatMessage(dec.user, dec.message, dec.user.id === commsUser.id, dec.image);
                if (dec.image && dec.user.id !== commsUser.id) {
                    saveIntelSnapshot(`RX_INTEL_${dec.user.callsign}`, dec.image);
                }
            }
        });

        // 1.5 Handle Audio (Voice)
        commsChannel.on('broadcast', { event: 'audio' }, (payload) => {
            const dec = TacticalCrypto.decrypt(payload.payload.data);
            if (dec && dec.audio && dec.user.id !== commsUser.id) {
                window.pushTacLog(`RX VOICE: ${dec.user.callsign}`, "SYS");
                const audio = new Audio(dec.audio);
                audio.play().catch(e => {
                    console.error("Audio playback failed:", e);
                    window.pushTacLog("RX VOICE BLOCKED BY BROWSER (TAP PAGE TO UNLOCK)", "ERROR");
                });
            }
        });

        // 2. Handle Radio (PTT)
        commsChannel.on('broadcast', { event: 'ptt' }, (payload) => {
            const dec = TacticalCrypto.decrypt(payload.payload.data);
            const activeSpeaker = document.getElementById('ptt-active-speaker');
            if (dec && activeSpeaker && dec.user.id !== commsUser.id) {
                if (dec.active) {
                    activeSpeaker.textContent = `${dec.user.callsign} (${dec.user.role})`;
                    activeSpeaker.classList.add('text-emerald-400', 'animate-pulse');
                    window.pushTacLog(`PTT OPEN: ${dec.user.callsign}`, "SYS");
                } else {
                    activeSpeaker.textContent = 'STANDBY';
                    activeSpeaker.classList.remove('text-emerald-400', 'animate-pulse');
                }
            }
        });

        // 3. Handle Presence (Roster & GPS)
        commsChannel.on('presence', { event: 'sync' }, () => {
            const state = commsChannel.presenceState();
            updateTeamRoster(state);
            updateTeamMarkers(state);
        });

        commsChannel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                window.pushTacLog(`LINK ESTABLISHED: MISSION CHANNEL ${teamName}`, "SUCCESS");
                
                // Show dashboard
                document.getElementById('comms-login').classList.add('hidden');
                document.getElementById('comms-dashboard').classList.remove('hidden');
                document.getElementById('comms-dashboard').classList.add('grid');
                
                const disconnectBtn = document.getElementById('comms-disconnect-btn');
                if (disconnectBtn) {
                    disconnectBtn.classList.remove('hidden');
                    disconnectBtn.onclick = () => {
                        commsChannel.unsubscribe();
                        document.getElementById('comms-login').classList.remove('hidden');
                        document.getElementById('comms-dashboard').classList.add('hidden');
                        document.getElementById('comms-dashboard').classList.remove('grid');
                        disconnectBtn.classList.add('hidden');
                        if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);
                        window.pushTacLog(`DISCONNECTED FROM NETWORK`, "SYS");
                    };
                }

                // Initialize Map
                initCommsMap();

                // Track presence
                commsChannel.track({ online_at: new Date().toISOString(), user: commsUser });
            }
        });
        } catch (error) {
            window.pushTacLog("SUPABASE LINK FAILED", "ERROR");
            console.error(error);
        }
    }

    function renderChatMessage(userObj, msg, isMe, imageBase64 = null) {
        const feed = document.getElementById('chat-feed');
        if (!feed) return;
        const entry = document.createElement('div');
        entry.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`;
        
        let contentHtml = '';
        if (msg) contentHtml += `<div>${msg}</div>`;
        if (imageBase64) contentHtml += `<img src="${imageBase64}" class="mt-1 rounded border border-gray-600 w-32 h-auto cursor-pointer" onclick="window.open(this.src)">`;

        entry.innerHTML = `
            <span class="text-[6px] text-gray-600 uppercase font-black">${userObj.callsign} [${userObj.role}]</span>
            <div class="${isMe ? 'bg-blue-900/60 border-blue-700' : 'bg-gray-800/60 border-gray-700'} border px-2 py-1 rounded-sm max-w-[80%] text-white">
                ${contentHtml}
            </div>
        `;
        feed.appendChild(entry);
        feed.scrollTop = feed.scrollHeight;
    }

    // PTT LOGIC
    let mediaRecorder = null;
    let audioChunks = [];
    const pttBtn = document.getElementById('ptt-btn');
    if (pttBtn) {
        const startPTT = async (e) => {
            if (e) e.preventDefault();
            pttBtn.classList.add('border-emerald-500', 'bg-emerald-950/20', 'shadow-[0_0_20px_rgba(16,185,129,0.3)]');
            commsChannel.send({
                type: 'broadcast',
                event: 'ptt',
                payload: { data: TacticalCrypto.encrypt({ active: true, user: commsUser }) }
            });
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("SECURE_CONTEXT_REQUIRED");
                }
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // If user already released the button while we were waiting for permissions, abort.
                if (!pttBtn.classList.contains('border-emerald-500')) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.ondataavailable = evt => {
                    if (evt.data.size > 0) audioChunks.push(evt.data);
                };
                mediaRecorder.onstop = () => {
                    if (audioChunks.length > 0) {
                        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onloadend = () => {
                            const base64AudioMessage = reader.result;
                            commsChannel.send({
                                type: 'broadcast',
                                event: 'audio',
                                payload: { data: TacticalCrypto.encrypt({ audio: base64AudioMessage, user: commsUser }) }
                            });
                        };
                    }
                    stream.getTracks().forEach(track => track.stop());
                };
                mediaRecorder.start();
            } catch (err) {
                console.error("Microphone access denied or error:", err);
                if (err.message === "SECURE_CONTEXT_REQUIRED") {
                    alert("MIC ERROR: Please ensure you access the app via HTTPS or use the Chrome/Edge insecure-origins flag.");
                } else {
                    alert("MIC ERROR: Access Denied. Check device permissions.");
                }
            }
        };
        const stopPTT = (e) => {
            if (e) e.preventDefault();
            pttBtn.classList.remove('border-emerald-500', 'bg-emerald-950/20', 'shadow-[0_0_20px_rgba(16,185,129,0.3)]');
            commsChannel.send({
                type: 'broadcast',
                event: 'ptt',
                payload: { data: TacticalCrypto.encrypt({ active: false, user: commsUser }) }
            });
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                try { mediaRecorder.requestData(); } catch(e) {}
                mediaRecorder.stop();
            }
        };
        pttBtn.onmousedown = startPTT;
        pttBtn.onmouseup = stopPTT;
        pttBtn.ontouchstart = startPTT;
        pttBtn.ontouchend = stopPTT;
    }

    // CHAT SEND
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send-btn');
    if (chatSend && chatInput) {
        const send = () => {
            const msg = chatInput.value.trim();
            if (!msg) return;
            commsChannel.send({
                type: 'broadcast',
                event: 'chat',
                payload: { data: TacticalCrypto.encrypt({ message: msg, user: commsUser }) }
            });
            renderChatMessage(commsUser, msg, true);
            chatInput.value = '';
        };
        chatSend.onclick = send;
        chatInput.onkeydown = (e) => { if (e.key === 'Enter') send(); };
        
        const chatImageUpload = document.getElementById('chat-image-upload');
        if (chatImageUpload) {
            chatImageUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const MAX_SIZE = 800;
                        if (width > height && width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        } else if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        const base64Image = canvas.toDataURL('image/jpeg', 0.6);
                        
                        commsChannel.send({
                            type: 'broadcast',
                            event: 'chat',
                            payload: { data: TacticalCrypto.encrypt({ message: "INCOMING IMAGE INTEL", image: base64Image, user: commsUser }) }
                        });
                        renderChatMessage(commsUser, "INCOMING IMAGE INTEL", true, base64Image);
                        saveIntelSnapshot("TX_INTEL_SELF", base64Image);
                    }
                    img.src = event.target.result;
                }
                reader.readAsDataURL(file);
                chatImageUpload.value = '';
            });
        }
    }

    function initCommsMap() {
        if (!commsMapInstance) {
            const container = document.getElementById('comms-map-instance');
            if (container) {
                commsMapInstance = L.map(container, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([31.9686, -99.9018], 13);
                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(commsMapInstance);
            }
        }
        
        let lastLat = 31.9686;
        let lastLng = -99.9018;
        let hasCentered = false;

        // Start tracking my own location
        if (navigator.geolocation && commsMapInstance) {
            if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);
            geoWatchId = navigator.geolocation.watchPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                lastLat = latitude;
                lastLng = longitude;
                if (!hasCentered) {
                    commsMapInstance.setView([latitude, longitude], 15);
                    hasCentered = true;
                }
                // Update Presence with location
                commsChannel.track({ 
                    online_at: new Date().toISOString(),
                    location: { lat: latitude, lng: longitude },
                    user: commsUser
                });
            });
        }

        const syncBtn = document.getElementById('comms-map-sync');
        if (syncBtn) {
            syncBtn.onclick = () => {
                commsMapInstance.setView([lastLat, lastLng], 15);
                window.pushTacLog("GPS ALIGNED TO LOCAL COORDINATES", "SYS");
            };
        }
    }

    function updateTeamRoster(state) {
        const roster = document.getElementById('team-roster');
        if (!roster) return;
        roster.innerHTML = '';
        const seenUsers = new Set();
        Object.keys(state).forEach(userId => {
            const presences = state[userId];
            if (presences.length > 0) {
                const p = presences[presences.length - 1];
                if (p.user && !seenUsers.has(p.user.id)) {
                    seenUsers.add(p.user.id);
                    const tag = document.createElement('span');
                    tag.className = 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 px-1.5 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-1';
                    tag.innerHTML = `<span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> ${p.user.callsign} [${p.user.role}]`;
                    roster.appendChild(tag);
                }
            }
        });
    }

    function updateTeamMarkers(state) {
        if (!commsMapInstance) return;
        const currentActiveUsers = new Set();
        Object.keys(state).forEach(userId => {
            const presences = state[userId];
            if (presences.length > 0) {
                const p = presences[presences.length - 1];
                if (p.location && p.user) {
                    currentActiveUsers.add(p.user.id);
                    if (!teamMarkers[p.user.id]) {
                        const isMe = p.user.id === commsUser.id;
                        const bgColor = isMe ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]';
                        const icon = L.divIcon({
                            className: 'custom-div-icon',
                            html: `<div class="w-3 h-3 ${bgColor} border-2 border-white rounded-full flex items-center justify-center text-[5px] text-white font-black"></div>`,
                            iconSize: [12, 12]
                        });
                        teamMarkers[p.user.id] = L.marker([p.location.lat, p.location.lng], { icon: icon }).addTo(commsMapInstance);
                        teamMarkers[p.user.id].bindTooltip(`${p.user.callsign} [${p.user.role}]`, { permanent: true, direction: 'top', className: 'tactical-tooltip' });
                    } else {
                        teamMarkers[p.user.id].setLatLng([p.location.lat, p.location.lng]);
                    }
                }
            }
        });
        
        // Remove markers for disconnected users
        Object.keys(teamMarkers).forEach(id => {
            if (!currentActiveUsers.has(id)) {
                commsMapInstance.removeLayer(teamMarkers[id]);
                delete teamMarkers[id];
            }
        });
    }
    // HELPER: LOAD NOTE BACK TO EDITOR
    window.loadNoteBackToEditor = function(item) {
        const modal = document.getElementById('remarks-modal');
        const titleInput = document.getElementById('remarks-title-input');
        const textInput = document.getElementById('remarks-input');
        const counter = document.getElementById('remarks-counter');

        if (!modal || !titleInput || !textInput) return;

        titleInput.value = item.remarksTitle || '';
        textInput.value = item.remarksText || '';
        if (counter) counter.textContent = `${textInput.value.length}/500`;

        modal.classList.remove('hidden');
        textInput.focus();
        
        // Ensure user is dropped back to the main dashboard
        document.querySelectorAll('.dash-panel.is-maximized').forEach(el => {
            window.toggleFullscreen(el.id);
        });
        
        window.pushTacLog(`NOTE LOADED: ${item.remarksTitle || 'SECURE NOTE'}`, "INFO");
        if (window.lucide) window.lucide.createIcons();
    };

    // --- REMARKS NOTEPAD LOGIC ---
    const remarksIconBtn = document.getElementById('remarks-icon-btn');
    const remarksModal = document.getElementById('remarks-modal');
    const remarksCloseBtn = document.getElementById('remarks-close-btn');
    const remarksTitleInput = document.getElementById('remarks-title-input');
    const remarksInput = document.getElementById('remarks-input');
    const remarksCounter = document.getElementById('remarks-counter');
    const remarksSaveBtn = document.getElementById('remarks-save-btn');

    if (remarksIconBtn && remarksModal) {
        remarksIconBtn.addEventListener('click', () => {
            remarksModal.classList.toggle('hidden');
            if (!remarksModal.classList.contains('hidden')) {
                remarksInput.focus();
            }
        });

        remarksCloseBtn.addEventListener('click', () => remarksModal.classList.add('hidden'));

        remarksInput.addEventListener('input', () => {
            remarksCounter.textContent = `${remarksInput.value.length}/500`;
        });

        // Initialize Drag and Drop for Remarks Notepad Modal (Mouse & Touch)
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        const dragHeader = remarksModal.querySelector('.cursor-move');
        
        if (dragHeader) {
            const startDrag = (e) => {
                if (e.target.closest('#remarks-close-btn') || e.target.closest('input') || e.target.closest('textarea')) return;
                
                isDragging = true;
                const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
                
                startX = clientX;
                startY = clientY;
                
                const rect = remarksModal.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;
                
                remarksModal.style.right = 'auto';
                remarksModal.style.left = `${initialLeft}px`;
                remarksModal.style.top = `${initialTop}px`;
                
                if (e.type === 'mousedown') {
                    document.addEventListener('mousemove', drag);
                    document.addEventListener('mouseup', stopDrag);
                } else {
                    document.addEventListener('touchmove', drag, { passive: false });
                    document.addEventListener('touchend', stopDrag);
                }
            };
            
            const drag = (e) => {
                if (!isDragging) return;
                if (e.cancelable) e.preventDefault();
                
                const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
                
                const dx = clientX - startX;
                const dy = clientY - startY;
                
                remarksModal.style.left = `${initialLeft + dx}px`;
                remarksModal.style.top = `${initialTop + dy}px`;
            };
            
            const stopDrag = () => {
                isDragging = false;
                document.removeEventListener('mousemove', drag);
                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('touchmove', drag);
                document.removeEventListener('touchend', stopDrag);
            };
            
            dragHeader.addEventListener('mousedown', startDrag);
            dragHeader.addEventListener('touchstart', startDrag, { passive: true });
        }

        remarksSaveBtn.addEventListener('click', async () => {
            const text = remarksInput.value.trim();
            if (!text) return;
            const title = remarksTitleInput.value.trim().toUpperCase() || 'SECURE NOTE';

            // Render to canvas to create image for Vault
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#0f172a'; // dark slate
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.textAlign = 'center';

            // Header
            ctx.fillStyle = '#eab308'; // yellow-500
            ctx.font = 'bold 16px monospace';
            ctx.fillText(`ReMarks - ${title}`, 200, 40);
            
            // Timestamp
            ctx.fillStyle = '#64748b'; // slate-500
            ctx.font = '10px monospace';
            ctx.fillText(new Date().toLocaleString(), 200, 60);

            // Divider
            ctx.strokeStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(40, 75);
            ctx.lineTo(360, 75);
            ctx.stroke();

            // Text Wrap & Render
            ctx.textAlign = 'left';
            ctx.fillStyle = '#fef08a'; // yellow-200
            ctx.font = '12px monospace';
            
            let y = 95;
            const maxWidth = 340;
            const x = 30; // Left padding

            const paragraphs = text.split('\n');
            for (let p = 0; p < paragraphs.length; p++) {
                const words = paragraphs[p].split(' ');
                let line = '';
                for (let n = 0; n < words.length; n++) {
                    let word = words[n];
                    
                    // Force-break massive strings that exceed the canvas width on their own
                    while (ctx.measureText(word).width > maxWidth) {
                        let chunk = '';
                        for (let c = 0; c < word.length; c++) {
                            if (ctx.measureText(chunk + word[c] + '-').width > maxWidth) break;
                            chunk += word[c];
                        }
                        if (line !== '') {
                            ctx.fillText(line.trim(), x, y);
                            y += 18;
                            line = '';
                        }
                        ctx.fillText(chunk + '-', x, y);
                        y += 18;
                        word = word.substring(chunk.length);
                    }

                    const testLine = line + word + ' ';
                    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
                        ctx.fillText(line.trim(), x, y);
                        line = word + ' ';
                        y += 18;
                    } else {
                        line = testLine;
                    }
                }
                if (line.trim() !== '') {
                    ctx.fillText(line.trim(), x, y);
                    y += 18;
                }
            }

            const base64Image = canvas.toDataURL('image/jpeg', 0.9);
            
            await saveIntelSnapshot('REMARKS', base64Image, { 
                remarksTitle: title, 
                remarksText: text 
            });
            
            // Auto-load to Active Viewer
            if (vaultCache.length > 0) {
                selectVaultItem(vaultCache[0]);
            }
            
            remarksInput.value = '';
            if (remarksTitleInput) remarksTitleInput.value = '';
            remarksCounter.textContent = '0/500';
            remarksModal.classList.add('hidden');
            window.pushTacLog("REMARKS NOTE SAVED TO VAULT", "SUCCESS");
        });
    }

    // === PERSISTENCE SHIELD: MISSION RECOVERY PROTOCOL ===
    let autoSaveTimeout;
    function triggerAutoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(async () => {
            if (!window.TRC_IDB) return;
            const state = {};
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) state[id] = el.value;
            });
            // Capture canvases
            state.holdShots = window.holdManager?.getShots() || [];
            state.shotShots = window.shotManager?.getShots() || [];
            
            await window.TRC_IDB.put('drafts', { id: '___DRAFT_RECOVERY___', data: state, timestamp: Date.now() });
            console.log('[SHIELD] Mission State Synchronized');
        }, 500);
    }

    // Bind auto-save to all inputs
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', triggerAutoSave);
    });

    // MISSION RECOVERY: Auto-load draft on startup
    async function recoverMission() {
        if (!window.TRC_IDB) return;
        const recovery = await window.TRC_IDB.get('drafts', '___DRAFT_RECOVERY___');
        if (recovery && recovery.data) {
            const data = recovery.data;
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el && data[id] !== undefined) {
                    el.value = data[id];
                    // Trigger sync to cards
                    el.dispatchEvent(new Event('input'));
                }
            });
            if (data.holdShots) window.holdManager?.setShots(data.holdShots);
            if (data.shotShots) window.shotManager?.setShots(data.shotShots);
            window.pushTacLog("MISSION RECOVERY: LAST SESSION RESTORED", "SYS");
        }
    }
    
    // Delayed recovery to ensure IDB is ready
    setTimeout(recoverMission, 1500);

}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTacticalDashboard2);
} else {
    initializeTacticalDashboard2();
}
