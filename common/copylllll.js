// ==UserScript==
// @name         FastPeopleSearch - Windermere Ct Batch Scraper (200-230)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Scrape resident info for Windermere Ct addresses 200-230 (auto-open tabs + extract)
// @author       You
// @match        https://www.fastpeoplesearch.com/*
// @grant        GM_setClipboard
// @grant        GM_notification
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // === CONFIG ===
    const AUTO_OPEN_TABS = true;          // Set to true → button opens all 31 tabs
    const OPEN_DELAY_MS = 800;             // Delay between opening tabs (helps avoid popup blocker)
    const BATCH_SCRAPE_ON_LOAD = false;    // If true + tabs open: auto-extract & store when page loads

    // Selector targets the common resident paragraph (based on site examples)
    const RESIDENT_SELECTOR = 'p, div, span, li';
    const KEY_PHRASE = /The most recent tenant is.*Past residents include/;

    // === STORAGE KEY ===
    const STORAGE_KEY = 'windermere_scrape_results';

    // === FUNCTIONS ===
    function getAddressNumber() {
        const match = location.href.match(/\/address\/(\d+)-Windermere-Ct_Canonsburg-PA-15317/);
        return match ? match[1] : null;
    }

    function extractResidentInfo() {
        let text = '';
        const elements = document.querySelectorAll(RESIDENT_SELECTOR);
        for (const el of elements) {
            const content = el.textContent.trim();
            if (KEY_PHRASE.test(content)) {
                text = content.replace(/\s+/g, ' ').trim();
                break;
            }
        }
        return text || 'No resident info found (check if CAPTCHA or page loaded fully).';
    }

    function saveResult(num, info) {
        let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!data.some(item => item.num === num)) {
            data.push({ num, info, timestamp: new Date().toISOString() });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }

    function getAllResults() {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return data.map(item => `${item.num}: ${item.info}`).join('\n\n');
    }

    function clearResults() {
        localStorage.removeItem(STORAGE_KEY);
        alert('Collected data cleared!');
    }

    // === AUTO-SCRAPE ON PAGE LOAD (if enabled) ===
    if (BATCH_SCRAPE_ON_LOAD && getAddressNumber()) {
        const num = getAddressNumber();
        const info = extractResidentInfo();
        saveResult(num, info);
        GM_notification({
            title: `Auto-scraped ${num}`,
            text: info.substring(0, 100) + (info.length > 100 ? '...' : ''),
            timeout: 5000
        });
        // Optional: close tab after scrape
        // setTimeout(() => window.close(), 4000);
    }

    // === FLOATING CONTROL PANEL ===
    function createControlPanel() {
        if (document.getElementById('windermere-control-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'windermere-control-panel';
        panel.style.cssText = `
            position: fixed; bottom: 20px; left: 20px; z-index: 999999;
            background: #1e3a8a; color: white; padding: 16px; border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6); font-family: Arial, sans-serif;
            width: 320px; font-size: 14px;
        `;

        let html = `
            <strong>Windermere Ct Scraper (200-230)</strong><br><br>
            <button id="btn-open-tabs" style="padding:10px 16px; background:#3b82f6; border:none; color:white; border-radius:6px; cursor:pointer; width:100%; margin-bottom:10px;">
                ${AUTO_OPEN_TABS ? 'Open All 31 Address Tabs' : 'Show Instructions / Manual Mode'}
            </button>
            <button id="btn-copy-all" style="padding:8px 16px; background:#10b981; border:none; color:white; border-radius:6px; cursor:pointer; width:48%; margin-right:4%;">
                Copy All Collected
            </button>
            <button id="btn-clear" style="padding:8px 16px; background:#ef4444; border:none; color:white; border-radius:6px; cursor:pointer; width:48%;">
                Clear Data
            </button>
            <div id="status" style="margin-top:12px; white-space:pre-wrap; max-height:200px; overflow-y:auto; background:rgba(255,255,255,0.15); padding:8px; border-radius:4px;"></div>
        `;

        panel.innerHTML = html;
        document.body.appendChild(panel);

        // Event listeners
        document.getElementById('btn-open-tabs').onclick = () => {
            if (AUTO_OPEN_TABS) {
                if (!confirm('Opening ~31 tabs — browser may block some. Continue?')) return;
                let i = 200;
                function openNext() {
                    if (i > 230) return;
                    window.open(`https://www.fastpeoplesearch.com/address/${i}-Windermere-Ct_Canonsburg-PA-15317`, '_blank');
                    i++;
                    setTimeout(openNext, OPEN_DELAY_MS);
                }
                openNext();
            } else {
                alert(`Manual mode active:\n\n1. Set AUTO_OPEN_TABS = true in script to auto-open tabs\n2. Or open pages yourself (e.g., change 205 to 200, 201, etc.)\n3. On each address page:\n   - If BATCH_SCRAPE_ON_LOAD = true → auto-saves\n   - Else click the blue "Extract..." button if added\n4. Come back here & click "Copy All Collected"`);
            }
        };

        document.getElementById('btn-copy-all').onclick = () => {
            const all = getAllResults();
            if (!all.trim()) {
                alert('No data collected yet.');
                return;
            }
            GM_setClipboard(all);
            document.getElementById('status').textContent = 'Copied to clipboard!\n\n' + all.substring(0, 300) + (all.length > 300 ? '...' : '');
        };

        document.getElementById('btn-clear').onclick = () => {
            if (confirm('Clear all collected results?')) clearResults();
        };

        // Show current collected count
        const count = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').length;
        document.getElementById('status').textContent = `Collected: ${count} addresses\n(Click "Copy All Collected" to view/paste)`;
    }

    // === ON ADDRESS PAGE: Add quick extract button ===
    if (getAddressNumber()) {
        const num = getAddressNumber();
        const btn = document.createElement('button');
        btn.textContent = `Extract Residents (${num})`;
        btn.style.cssText = 'position:fixed; top:10px; right:10px; z-index:999999; padding:12px 20px; background:#3b82f6; color:white; border:none; border-radius:6px; font-size:16px; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.4);';
        document.body.appendChild(btn);

        btn.onclick = () => {
            const info = extractResidentInfo();
            saveResult(num, info);
            alert(`Saved for ${num}:\n\n${info}`);
            GM_notification({ title: `Saved ${num}`, text: info.substring(0, 80) + '...' });
        };
    }

    // Init panel
    createControlPanel();

})();
