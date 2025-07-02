// ==UserScript==
// @name         Roblox Auto Password Filler Visible & Typed
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Autofills visible password and types it into new/confirm fields to prevent reset when pasting current password on Roblox account page.
// @author       you
// @match        https://www.roblox.com/my/account*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let pass = 'synkris';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  function typeIntoInput(input, text) {
    input.focus();
    input.value = ''; // clear first
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      input.value += char;

      // Fire input & change events to simulate typing
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  const observer = new MutationObserver(() => {
    const passwordInputs = document.querySelectorAll('input[type="password"], input[data-testid="change-password-input"]');
    if (passwordInputs.length >= 3) {
      const currentPasswordInput = passwordInputs[0];
      const newPasswordInput = passwordInputs[1];
      const confirmPasswordInput = passwordInputs[2];

      newPasswordInput.type = 'text';
      confirmPasswordInput.type = 'text';

      const newPass = generatePassword();

      typeIntoInput(newPasswordInput, newPass);
      typeIntoInput(confirmPasswordInput, newPass);

      console.log('%c[SynkrisPassGen] Typed Password:', 'color: limegreen;', newPass);

      // Clear if user types in current password
      currentPasswordInput.addEventListener('input', () => {
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
      });

      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
