// public/init.js
// Small initialization moved out of index.html to avoid CSP issues.
// Sets the API URL used by script.js and updates the page year.

(function () {
  try {
    // Set the API base expected by script.js
    window.API_URL = '/api';
  } catch (e) {
    // ignore
  }

  try {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  } catch (e) {
    // ignore
  }
})();
