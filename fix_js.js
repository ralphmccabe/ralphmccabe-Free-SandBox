const fs = require('fs');
let content = fs.readFileSync('original_script.js', 'utf8');

// The bad string started with "// Save Weather to Vault Logic"
const badIndex = content.indexOf('// Save Weather to Vault Logic');

if (badIndex !== -1) {
    // Cut the bad text off
    content = content.substring(0, badIndex);
}

// Append the correct text
const correctJS = `// Save Weather to Vault Logic
document.getElementById('btn-weather-to-vault').addEventListener('click', async () => {
    const targetEl = document.getElementById('weather-panel-content');
    const btn = document.getElementById('btn-weather-to-vault');
    const originalText = btn.innerHTML;
    btn.innerHTML = \`<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> SAVING...\`;
    
    try {
        const canvas = await window.html2canvas(targetEl, {
            backgroundColor: '#000000',
            scale: window.innerWidth < 768 ? 1 : 2,
            logging: false
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const timeStr = \`\${mm}\${dd}-\${hh}\${min}\`;
        
        window.saveIntelSnapshot(\`WEATHER-\${timeStr}\`, imgData);
        
        btn.innerHTML = \`<i data-lucide="check" class="w-3 h-3"></i> SAVED!\`;
        if (window.pushTacLog) window.pushTacLog("WEATHER SNAPSHOT SAVED TO INTEL VAULT", "SUCCESS");
        
        setTimeout(() => { btn.innerHTML = originalText; if (window.lucide) window.lucide.createIcons(); }, 2000);
    } catch (e) {
        console.error("Weather save error", e);
        btn.innerHTML = \`<i data-lucide="alert-triangle" class="w-3 h-3"></i> ERROR\`;
        setTimeout(() => { btn.innerHTML = originalText; if (window.lucide) window.lucide.createIcons(); }, 2000);
    }
});
`;

content += correctJS;

fs.writeFileSync('original_script.js', content);
fs.writeFileSync('original_script.min.js', content);

console.log('Fixed JS parsing error and copied to min.js');
