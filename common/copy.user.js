// ==UserScript==
// @name         FastPeopleSearch - Windermere Ct Batch Scraper (200-230)
// @namespace    http://yournamespace/
// @version      1.1
// @description  Opens or scrapes resident info for addresses 200-230 Windermere Ct, Canonsburg PA 15317
// @author       You
// @match        https://www.fastpeoplesearch.com/address/*-Windermere-Ct_Canonsburg-PA-15317
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Change to true if you want it to auto-open all tabs (careful – 31 tabs!)
    const AUTO_OPEN_TABS = false;

    // If false, it will scrape the CURRENT page only when you load it
    const BATCH_SCRAPE_ON_LOAD = false;   // usually keep false unless you want auto-scrape

    // Where the resident text usually lives (based on common patterns; may need adjustment)
    const SELECTOR = 'div:contains("most recent"), div:contains("current resident"), div:contains("Past residents"), p:contains("tenant"), .card-body, .profile-info, [class*="resident"], [class*="occupant"], [class*="history"]';

    // Container to show results if scraping current page
    function addResultsBox() {
        if (document.getElementById('scraper-results')) return;
        const box = document.createElement('div');
        box.id = 'scraper-results';
        box.style.cssText = 'position:fixed; top:10px; right:10px; width:380px; max-height:80vh; overflow-y:auto; background:#fff; border:2px solid #0066cc; padding:12px; z-index:999999; font-family:Arial; font-size:14px; box-shadow:0 0 15px rgba(0,0,0,0.5);';
        document.body.appendChild(box);
        return box;
    }

    function extractResidentText() {
        // Try common selectors first
        let text = '';

        // Look for paragraphs or divs with the phrase
        const candidates = document.querySelectorAll('p, div, li, span');
        for (const el of candidates) {
            const t = el.textContent.trim();
            if (t.includes('most recent tenant') || t.includes('current resident') || t.includes('Past residents include')) {
                text = t;
                break;
            }
        }

        // Fallback: broader search
        if (!text) {
            const broad = document.querySelector(SELECTOR);
            if (broad) text = broad.textContent.trim().replace(/\s+/g, ' ');
        }

        return text || 'No matching resident text found on this page.';
    }

    // If on a matching address page
    if (location.href.includes('Windermere-Ct_Canonsburg-PA-15317')) {
        const addressNum = location.href.match(/\/address\/(\d+)-Windermere/)?.[1] || '???';

        if (BATCH_SCRAPE_ON_LOAD) {
            // Auto-scrape when page loads (useful if opening many tabs)
            const info = extractResidentText();
            const result = `${addressNum}: ${info}\n\n`;

            // Append to a global-ish storage or just copy
            let all = localStorage.getItem('windermere_scrape') || '';
            all += result;
            localStorage.setItem('windermere_scrape', all);

            // Show notification
            GM_notification({
                title: `Scraped ${addressNum}`,
                text: info.substring(0, 120) + '...',
                timeout: 4000
            });

            // Optional: auto-close tab after scrape
            // setTimeout(() => window.close(), 3000);
        } else {
            // Manual mode: show button + result box on page
            const box = addResultsBox();
            box.innerHTML = `<h3 style="margin:0 0 10px;">Address ${addressNum}</h3>
                             <button id="scrape-this" style="padding:8px 16px; background:#0066cc; color:white; border:none; cursor:pointer;">Extract Residents</button>
                             <pre id="result-text" style="white-space:pre-wrap; margin-top:12px;"></pre>
                             <button id="copy-all" style="margin-top:10px; padding:6px 12px;">Copy All Collected</button>`;

            document.getElementById('scrape-this').onclick = () => {
                const info = extractResidentText();
                document.getElementById('result-text').textContent = info;
                GM_notification({title: 'Extracted', text: info.substring(0, 80) + '...'});
            };

            document.getElementById('copy-all').onclick = () => {
                const all = localStorage.getItem('windermere_scrape') || 'Nothing collected yet.';
                GM_setClipboard(all);
                alert('All collected results copied to clipboard!\n\n' + all.substring(0, 300) + '...');
            };
        }
    }

    // Optional: Add a floating start button on any page (or just on fastpeoplesearch.com home)
    if (!AUTO_OPEN_TABS) {
        const startBtn = document.createElement('button');
        startBtn.textContent = 'Start Windermere 200-230 Scrape';
        startBtn.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:999999; padding:12px 20px; background:#ff4444; color:white; border:none; border-radius:6px; font-size:16px; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.4);';
        document.body.appendChild(startBtn);

        startBtn.onclick = () => {
            if (AUTO_OPEN_TABS) {
                if (!confirm('This will try to open ~31 tabs. Continue?')) return;
                for (let num = 200; num <= 230; num++) {
                    window.open(`https://www.fastpeoplesearch.com/address/${num}-Windermere-Ct_Canonsburg-PA-15317`, '_blank');
                }
            } else {
                alert('Manual mode active.\n\n1. Click the button above to open tabs manually (or use AUTO_OPEN_TABS = true)\n2. On each address page, click "Extract Residents"\n3. Use "Copy All Collected" to get everything');
            }
        };
    }

})();
