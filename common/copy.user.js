// ==UserScript==
// @name         Mobile Clipboard Paste Logger
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Track pasted clipboard entries on mobile (with a floating button to view history)
// @author       ChatGPT
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const MAX_HISTORY = 20;
    const STORAGE_KEY = 'mobileClipboardPasteHistory';

    function getHistory() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function addToHistory(text) {
        if (!text || text.trim() === '') return;
        let history = getHistory();
        if (history[0] !== text) {
            history.unshift(text);
            if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
            saveHistory(history);
        }
    }

    document.addEventListener('paste', (event) => {
        const pastedText = event.clipboardData?.getData('text');
        if (pastedText) addToHistory(pastedText);
    });

    // Create floating button for viewing clipboard history
    const btn = document.createElement('button');
    btn.innerText = '📋';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '99999',
        padding: '10px',
        borderRadius: '50%',
        fontSize: '20px',
        background: '#007bff',
        color: '#fff',
        border: 'none',
        boxShadow: '0 0 5px rgba(0,0,0,0.3)',
        cursor: 'pointer'
    });

    btn.addEventListener('click', () => {
        const history = getHistory();
        if (history.length === 0) {
            alert('📋 Clipboard history is empty.');
            return;
        }

        const choice = prompt(
            "📋 Clipboard Paste History:\n\n" +
            history.map((entry, i) => `[${i + 1}] ${entry.slice(0, 50)}`).join("\n") +
            "\n\nEnter number to copy it again:"
        );

        const index = parseInt(choice, 10) - 1;
        if (!isNaN(index) && history[index]) {
            navigator.clipboard.writeText(history[index]).then(() => {
                alert("Copied to clipboard:\n\n" + history[index]);
            });
        }
    });

    document.body.appendChild(btn);
})();
