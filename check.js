const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => { console.error("Error:", err.message, err.stack); });
virtualConsole.on("warn", (warn) => { console.warn("Warn:", warn); });
virtualConsole.on("info", (info) => { console.info("Info:", info); });
virtualConsole.on("dir", (dir) => { console.dir("Dir:", dir); });
virtualConsole.on("log", (log) => { console.log("Log:", log); });
virtualConsole.on("jsdomError", (err) => { console.error("JSDOM Error:", err.message, err.stack); });

console.log("Loading JSDOM...");

const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable",
    virtualConsole
});

setTimeout(() => {
    console.log("JSDOM loaded.");
    console.log("Number of elements:", dom.window.document.querySelectorAll('*').length);
}, 2000);
