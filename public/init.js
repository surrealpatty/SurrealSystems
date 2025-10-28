// public/init.js
(function () {
  try {
    function normalize(url) {
      if (!url) return url;
      return String(url).replace(/\/+$/, '');
    }

    let api = null;

    // 1) explicit window.__API_URL__ (optional build injection)
    try { if (typeof window.__API_URL__ !== 'undefined' && window.__API_URL__) api = normalize(window.__API_URL__); } catch (e) {}

    // 2) meta tag <meta name="api-url" content="..."> (optional)
    try {
      if (!api) {
        const meta = document.querySelector('meta[name="api-url"]');
        if (meta && meta.content) api = normalize(meta.content);
      }
    } catch (e) {}

    // 3) existing globals (fallback if page sets them)
    try {
      if (!api && typeof window.API_URL !== 'undefined' && window.API_URL) api = normalize(window.API_URL);
      if (!api && typeof window.API_BASE !== 'undefined' && window.API_BASE) api = normalize(window.API_BASE);
    } catch (e) {}

    // 4) same-origin + /api fallback
    if (!api) {
      try { api = (window.location.origin || '').replace(/\/$/, '') + '/api'; } catch (e) { api = '/api'; }
    }

    window.API_BASE = api;
    window.API_URL = api;
    try { console.info('Init: API_URL =', window.API_URL); } catch (e) {}
  } catch (e) { /* ignore */ }
})();
