import os

js_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox\original_script.js"
with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the prompt logic
old_logic = """    saveProfileBtn.onclick = () => {
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
        }"""

new_logic = """    saveProfileBtn.onclick = () => {
        const existingProfiles = getProfiles();
        const dopeCount = Object.keys(existingProfiles).filter(k => !existingProfiles[k].isReconScenario).length;
        if (dopeCount >= 20) {
            alert("LIBRARY FULL: DOPE CACHE CAPACITY REACHED (20/20). PLEASE DELETE OLD CARDS FIRST.");
            return;
        }

        const modal = document.getElementById('save-profile-modal');
        const input = document.getElementById('save-profile-input');
        const cancelBtn = document.getElementById('save-profile-cancel');
        const confirmBtn = document.getElementById('save-profile-confirm');

        if (!modal) {
            console.error("Save modal not found!");
            return;
        }

        modal.classList.remove('hidden');
        input.value = '';
        input.focus();

        const closeAndCleanup = () => {
            modal.classList.add('hidden');
            cancelBtn.onclick = null;
            confirmBtn.onclick = null;
        };

        cancelBtn.onclick = () => closeAndCleanup();

        confirmBtn.onclick = () => {
            const name = input.value.trim();
            if (!name) {
                alert("PLEASE ENTER A VALID NAME");
                return;
            }

            const lowerName = name.toLowerCase();
            const nameExists = Object.keys(existingProfiles).some(k => k.trim().toLowerCase() === lowerName);
            if (nameExists) {
                alert("NAME ALREADY EXIST");
                return;
            }

            closeAndCleanup();
            executeSave(name);
        };
    };

    function executeSave(name) {"""

# Replace and make sure executeSave wraps the rest of the function block
content = content.replace(old_logic, new_logic)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(content)

# We also need to minify it since index.html uses original_script.min.js
min_path = r"C:\Users\RalphMccabe\.gemini\antigravity\scratch\free-trc-sandbox\original_script.min.js"
with open(min_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("original_script.js updated to use custom modal.")
