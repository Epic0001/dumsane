// ==UserScript==
// @name         FastPeopleSearch Windermere Ct (200-230) Tab Opener + Scraper
// @namespace    http://yournamespace/
// @version      1.3
// @description  Open 200-230 Windermere Ct pages in tabs + extract resident info
// @author       You
// @match        https://www.fastpeoplesearch.com/*
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        GM_notification
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // === CONFIG ===
    const START_NUM = 200;
    const END_NUM   = 230;
    const DELAY_MS  = 1200;           // Increase if tabs get blocked (1500–2000 ms often helps)
    const STORAGE_KEY = 'windermere_residents_200_230';

    // === HELPERS ===
    function getAddressNumber() {
        const m = location.href.match(/\/address\/(\d+)-Windermere-Ct_Canonsburg-PA-15317/i);
        return m ? parseInt(m[1], 10) : null;
    }

    function extractText() {
        let found = '';
        // Scan common elements for the tell-tale sentence
        document.querySelectorAll('p, div, span, li, h2, h3, .card-body, [class*="info"], [class*="resident"], [class*="occupant"]').forEach(el => {
            const t = el.textContent.replace(/\s+/g, ' ').trim();
            if (t.includes('most recent tenant') && t.includes('Past residents include')) {
                found = t;
            }
        });
        return found || 'No resident text detected (possible CAPTCHA, loading issue, or different page layout).';
    }

    function saveResult(num, text) {
        let data = GM_getValue(STORAGE_KEY, {});
        data[num] = text;
        GM_setValue(STORAGE_KEY, data);
        GM_notification({
            title: `Saved ${num}`,
            text: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
            timeout: 4000
        });
    }

    function getAllSaved() {
        const data = GM_getValue(STORAGE_KEY, {});
        return Object.entries(data)
            .sort((a,b) => Number(a[0]) - Number(b[0]))
            .map(([num, txt]) => `${num}: ${txt}`)
            .join('\n\n');
    }

    function clearSaved() {
        GM_setValue(STORAGE_KEY, {});
        alert('All saved results cleared.');
    }

    // === AUTO-EXTRACT BUTTON ON ADDRESS PAGES ===
    const num = getAddressNumber();
    if (num && num >= START_NUM && num <= END_NUM) {
        const btn = document.createElement('button');
        btn.textContent = `Extract Residents (${num})`;
        btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:999999;padding:12px 20px;background:#2563eb;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.4);';
        document.body.appendChild(btn);

        btn.onclick = () => {
            const info = extractText();
            saveResult(num, info);
            alert(`Saved for ${num}:\n\n${info}`);
        };
    }

    // === CONTROL PANEL (always visible on site) ===
    function addControlPanel() {
        if (document.getElementById('wct-control')) return;

        const panel = document.createElement('div');
        panel.id = 'wct-control';
        panel.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:999999;background:#1e40af;color:white;padding:16px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.5);font-family:Arial;font-size:14px;width:340px;';

        panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:10px;">Windermere Ct 200–230 Scraper</div>
            <button id="open-all-btn" style="width:100%;padding:10px;background:#3b82f6;border:none;color:white;border-radius:6px;cursor:pointer;margin-bottom:12px;">
                Open All 31 Addresses in Tabs
            </button>
            <button id="copy-btn" style="width:48%;padding:8px;background:#10b981;border:none;color:white;border-radius:6px;cursor:pointer;margin-right:4%;">
                Copy All Collected
            </button>
            <button id="clear-btn" style="width:48%;padding:8px;background:#ef4444;border:none;color:white;border-radius:6px;cursor:pointer;">
                Clear Data
            </button>
            <div id="status" style="margin-top:12px;max-height:180px;overflow-y:auto;background:rgba(255,255,255,0.2);padding:8px;border-radius:4px;white-space:pre-wrap;"></div>
        `;

        document.body.appendChild(panel);

        document.getElementById('open-all-btn').onclick = () => {
            if (!confirm(`Open ${END_NUM - START_NUM + 1} tabs? (They'll open one by one with delay)`)) return;

            let current = START_NUM;
            function openNext() {
                if (current > END_NUM) {
                    alert('Finished opening tabs.');
                    return;
                }
                const url = `https://www.fastpeoplesearch.com/address/${current}-Windermere-Ct_Canonsburg-PA-15317`;
                GM_openInTab(url, { active: false, insert: true });   // background tab, insert next to current
                current++;
                setTimeout(openNext, DELAY_MS);
            }
            openNext();
        };

        document.getElementById('copy-btn').onclick = () => {
            const all = getAllSaved();
            if (!all.trim()) {
                alert('Nothing collected yet.');
                return;
            }
            GM_setClipboard(all);
            document.getElementById('status').textContent = 'Copied to clipboard!\n\n' + all.slice(0, 400) + (all.length > 400 ? '\n...' : '');
        };

        document.getElementById('clear-btn').onclick = () => {
            if (confirm('Clear ALL saved results?')) {
                clearSaved();
                document.getElementById('status').textContent = 'Data cleared.';
            }
        };

        // Show count on load
        const count = Object.keys(GM_getValue(STORAGE_KEY, {})).length;
        document.getElementById('status').textContent = `Collected: ${count} / ${END_NUM - START_NUM + 1}\n(click "Copy All Collected" to paste)`;
    }

    addControlPanel();

})();
