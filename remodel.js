const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old matrix from the bottom
content = content.replace(/<!-- MATRIX GENERATOR MODAL -->[\s\S]*?<\/div>\s*<\/div>\s*<\/body>/, "</body>");

// 2. Inject it into the ballistic panel content
const panelTarget = `id="ballistic-panel-content">`;
const injection = `
                        <!-- MATRIX GENERATOR LOCALIZED PANEL -->
                        <div id="matrix-generator-modal" class="absolute inset-0 bg-gray-950 z-[150] hidden flex-col opacity-0 transition-opacity duration-300" style="margin:0;">
                            <div class="flex-1 flex flex-col overflow-hidden w-full h-full" id="matrix-generator-panel">
                                <!-- Header -->
                                <div class="bg-blue-950 border-b border-blue-800 p-3 flex justify-between items-center shrink-0">
                                    <h3 class="text-blue-400 font-black tracking-widest uppercase flex items-center gap-2"><i data-lucide="table" class="w-4 h-4"></i> Ballistic Matrix Generator</h3>
                                    <button onclick="toggleMatrixGenerator()" class="text-gray-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                                </div>
                                <!-- Controls -->
                                <div class="p-3 border-b border-gray-800 shrink-0 bg-gray-950 flex flex-wrap gap-2 justify-between items-end">
                                    <div>
                                        <label class="block text-[9px] text-gray-500 uppercase font-bold mb-1">Target Increment</label>
                                        <div class="flex bg-gray-900 rounded border border-gray-700 p-0.5" id="matrix-increment-group">
                                            <button class="matrix-inc-btn px-2 py-1 text-xs font-bold rounded transition-colors text-gray-400 hover:text-white" data-inc="10">10y</button>
                                            <button class="matrix-inc-btn px-2 py-1 text-xs font-bold rounded transition-colors text-gray-400 hover:text-white" data-inc="25">25y</button>
                                            <button class="matrix-inc-btn px-2 py-1 text-xs font-bold rounded transition-colors bg-blue-600 text-white" data-inc="50">50y</button>
                                            <button class="matrix-inc-btn px-2 py-1 text-xs font-bold rounded transition-colors text-gray-400 hover:text-white" data-inc="100">100y</button>
                                        </div>
                                    </div>
                                    <button id="btn-generate-matrix" class="bg-blue-600 text-white px-4 py-1.5 rounded font-black uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.5)] flex items-center gap-2 text-xs">
                                        <i data-lucide="zap" class="w-4 h-4"></i> Generate
                                    </button>
                                </div>
                                <!-- Table Container (Snapshot Target) -->
                                <div class="p-2 overflow-y-auto flex-1 bg-black" id="matrix-table-container">
                                    <div id="matrix-snapshot-target" class="bg-black p-2 rounded border border-gray-800 min-h-[200px]">
                                        <div class="text-center text-gray-600 font-mono text-xs mt-4" id="matrix-empty-state">
                                            <i data-lucide="crosshair" class="w-8 h-8 mx-auto mb-2 opacity-20"></i>
                                            Select increment and generate matrix to populate chart.<br>
                                            <span class="text-[9px] text-gray-700 mt-2 block">Dormant - Uses current active DOPE inputs</span>
                                        </div>
                                        <table class="w-full text-left font-mono text-xs hidden" id="matrix-table">
                                            <thead class="text-[9px] text-gray-500 uppercase border-b border-gray-700">
                                                <tr>
                                                    <th class="py-1 px-1 text-emerald-500">Dist</th>
                                                    <th class="py-1 px-1 text-blue-400">Elev</th>
                                                    <th class="py-1 px-1 text-red-400">Wind</th>
                                                    <th class="py-1 px-1 hidden sm:table-cell">Vel</th>
                                                    <th class="py-1 px-1 hidden sm:table-cell">Energy</th>
                                                </tr>
                                            </thead>
                                            <tbody id="matrix-tbody" class="text-gray-300 divide-y divide-gray-800">
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <!-- Footer / Action -->
                                <div class="p-3 border-t border-gray-800 shrink-0 bg-gray-950 flex justify-end">
                                    <button id="btn-matrix-to-vault" class="hidden bg-emerald-600 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.4)] flex items-center gap-2">
                                        <i data-lucide="save" class="w-4 h-4"></i> Save to Vault
                                    </button>
                                </div>
                            </div>
                        </div>`;

content = content.replace(panelTarget, panelTarget + injection);
fs.writeFileSync('index.html', content);
console.log('HTML modified successfully');
