const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const anchor = `<span class="text-sm font-bold text-yellow-500 leading-none" id="wx-elev">----</span>`;

const injection = `
                                <span class="text-[6px] text-gray-400 mt-0.5">FEET (MSL)</span>
                            </div>
                            
                            <!-- DENSITY ALT (SPANS FULL WIDTH AT BOTTOM) -->
                            <div class="col-span-2 bg-gradient-to-br from-emerald-950/30 to-transparent border border-emerald-800/50 p-2 rounded flex flex-col items-center justify-center relative overflow-hidden">
                                <span class="text-[6px] text-emerald-500 font-black absolute top-1 left-1 uppercase">DENSITY ALT</span>
                                <span class="text-xl font-black text-white leading-none" id="wx-da">----</span>
                                <span class="text-[6px] text-emerald-400/80 mt-0.5 uppercase font-bold">FEET D.A.</span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="mt-3 grid grid-cols-2 gap-2">
                            <button id="sync-wx-btn" class="w-full bg-blue-950/40 hover:bg-blue-900/60 border border-blue-900/60 py-1.5 rounded text-[8px] font-black uppercase text-blue-300 flex items-center justify-center gap-1.5 tracking-[0.15em] transition-all active:scale-95">
                                <i data-lucide="satellite-dish" class="w-3 h-3"></i> SYNC
                            </button>
                            <button id="btn-weather-to-vault" class="w-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-900/60 py-1.5 rounded text-[8px] font-black uppercase text-emerald-300 flex items-center justify-center gap-1.5 tracking-[0.15em] transition-all active:scale-95">
                                <i data-lucide="save" class="w-3 h-3"></i> VAULT
                            </button>
                        </div>
                    </div>
                </div>`;

// Replace from anchor to the Ballistic panel
content = content.replace(/<span class="text-sm font-bold text-yellow-500 leading-none" id="wx-elev">----<\/span>[\s\S]*?<!-- Ballistic Solver Module -->/m, anchor + injection + '\n\n                <!-- Ballistic Solver Module -->');

fs.writeFileSync('index.html', content);
console.log("Fixed index.html");
