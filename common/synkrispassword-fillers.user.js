// ==UserScript==
// @name         Roblox Auto Password Filler (Re-Type on Paste Fix)
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Re-types password into new/confirm boxes after paste resets them on Roblox account page.
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
    input.value = '';
    for (let i = 0; i < text.length; i++) {
      input.value += text[i];
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  let savedPassword = null;

  const observer = new MutationObserver(() => {
    const passwordInputs = document.querySelectorAll('input[type="password"], input[data-testid="change-password-input"]');
    if (passwordInputs.length >= 3) {
      const currentInput = passwordInputs[0];
      const newInput = passwordInputs[1];
      const confirmInput = passwordInputs[2];

      // Make them visible
      newInput.type = 'text';
      confirmInput.type = 'text';

      // Only generate once per session
      if (!savedPassword) {
        savedPassword = generatePassword();
        console.log('%c[SynkrisPassGen] Generated Password:', 'color: limegreen;', savedPassword);
      }

      // Type password into both fields
      typeIntoInput(newInput, savedPassword);
      typeIntoInput(confirmInput, savedPassword);

      // Listen for paste or typing in current password input
      currentInput.addEventListener('input', () => {
        // Let Roblox do its wipe/re-render first, then try to re-type password again
        setTimeout(() => {
          const newInputs = document.querySelectorAll('input[type="password"], input[data-testid="change-password-input"]');
          if (newInputs.length >= 3) {
            const newInput2 = newInputs[1];
            const confirmInput2 = newInputs[2];
            newInput2.type = 'text';
            confirmInput2.type = 'text';
            typeIntoInput(newInput2, savedPassword);
            typeIntoInput(confirmInput2, savedPassword);
            console.log('%c[SynkrisPassGen] Re-Typed Password after paste', 'color: orange;');
          }
        }, 100); // Slight delay for Roblox to finish re-rendering
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
