
// --- NEW LOGIC: TACTICAL HINTS & MATRIX GENERATOR ---
window.toggleTacticalHints = function() {
    const modal = document.getElementById('tactical-hints-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    } else {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
};

window.toggleMatrixGenerator = function() {
    const modal = document.getElementById('matrix-generator-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    } else {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
};

let matrixIncrement = 50;

// Setup Increment Buttons
document.querySelectorAll('.matrix-inc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.matrix-inc-btn').forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white');
            b.classList.add('text-gray-400');
        });
        e.target.classList.remove('text-gray-400');
        e.target.classList.add('bg-blue-600', 'text-white');
        matrixIncrement = parseInt(e.target.getAttribute('data-inc'), 10);
    });
});

// Generate Matrix Logic
document.getElementById('btn-generate-matrix').addEventListener('click', () => {
    const rangeInput = document.getElementById('bal-input-range');
    const originalRange = parseFloat(rangeInput.value) || 100;
    
    // We will generate rows up to the current target, or a min of 250y if target is very close
    const maxRange = Math.max(originalRange, 250);
    const tbody = document.getElementById('matrix-tbody');
    tbody.innerHTML = '';
    
    document.getElementById('matrix-empty-state').classList.add('hidden');
    document.getElementById('matrix-table').classList.remove('hidden');
    document.getElementById('btn-matrix-to-vault').classList.remove('hidden');
    
    const opticMode = window.currentOpticMode || 'MIL';
    let isPrevLogThrottle = window.solverLogThrottle;
    window.solverLogThrottle = setTimeout(()=>{}, 99999); // suppress logs temporarily
    
    for (let d = matrixIncrement; d <= maxRange; d += matrixIncrement) {
        // Hijack DOM input
        rangeInput.value = d;
        window.runSolverMatrix(); // calculate synchronous
        
        // Harvest results from the DOM updates
        const elev = document.getElementById('sol-elev-mil')?.textContent || '0.00';
        const elevDir = document.getElementById('sol-elev-dir')?.textContent || 'U';
        const wind = document.getElementById('sol-wind-mil')?.textContent || '0.00';
        const windDir = document.getElementById('sol-wind-dir')?.textContent || 'R';
        const vel = document.getElementById('sol-vel')?.textContent || '0';
        const energy = document.getElementById('sol-energy')?.textContent || '0';
        
        // Build row
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-1 px-2 border-r border-gray-800 text-emerald-400">${d}</td>
            <td class="py-1 px-2 border-r border-gray-800">${elevDir}${elev} ${opticMode}</td>
            <td class="py-1 px-2 border-r border-gray-800">${windDir}${wind} ${opticMode}</td>
            <td class="py-1 px-2 hidden sm:table-cell text-gray-400 border-r border-gray-800">${vel}</td>
            <td class="py-1 px-2 hidden sm:table-cell text-gray-500">${energy}</td>
        `;
        tbody.appendChild(tr);
    }
    
    // Restore and recalculate
    rangeInput.value = originalRange;
    window.runSolverMatrix();
    clearTimeout(window.solverLogThrottle);
    window.solverLogThrottle = isPrevLogThrottle;
});

// Save to Vault Logic
document.getElementById('btn-matrix-to-vault').addEventListener('click', async () => {
    const targetEl = document.getElementById('matrix-snapshot-target');
    const btn = document.getElementById('btn-matrix-to-vault');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> SAVING...`;
    
    try {
        const canvas = await html2canvas(targetEl, {
            backgroundColor: '#000000',
            scale: window.innerWidth < 768 ? 1 : 2,
            logging: false
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        
        // Formulate a clean intel record name
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const timeStr = `${mm}${dd}-${hh}${min}`;
        
        saveIntelSnapshot(imgData, `MATRIX-${timeStr}`);
        
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> SAVED!`;
        if (window.pushTacLog) window.pushTacLog("BALLISTIC MATRIX SAVED TO INTEL VAULT", "SUCCESS");
        
        setTimeout(() => { btn.innerHTML = originalText; lucide.createIcons(); }, 2000);
    } catch (e) {
        console.error("Matrix save error", e);
        btn.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4"></i> ERROR`;
        setTimeout(() => { btn.innerHTML = originalText; lucide.createIcons(); }, 2000);
    }
});
