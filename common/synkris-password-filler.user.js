// ==UserScript==
// @name         Roblox Auto Password Filler
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Auto-fill new & confirm password with a synkris-style password on Roblox account info page
// @author       you
// @match        https://www.roblox.com/my/account*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Password generator
  function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let pass = 'synkris';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  // Watch for the change password modal opening
  const observer = new MutationObserver(() => {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 3) {
      const newPassword = generatePassword();

      passwordInputs[1].value = newPassword; // New password
      passwordInputs[2].value = newPassword; // Confirm password

      console.log('%c[SynkrisPassGen] Generated Password:', 'color: limegreen;', newPassword);

      observer.disconnect(); // Stop watching after fill
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
