// ==== Auth keys ====
const TOKEN_KEY = 'token';
const USER_ID_KEY = 'userId';

// ---- token helpers
const getToken   = () => localStorage.getItem(TOKEN_KEY) || '';
const setToken   = (t) => localStorage.setItem(TOKEN_KEY, t || '');
const clearToken = () => localStorage.removeItem(TOKEN_KEY);
const setUserId  = (id) => localStorage.setItem(USER_ID_KEY, String(id || ''));
const getUserId  = () => localStorage.getItem(USER_ID_KEY) || '';
const clearUserId= () => localStorage.removeItem(USER_ID_KEY);

// ---- simple login state
const isLoggedIn = () => !!getToken() && !!getUserId();

// ==== API base ====
// Backend (server.js) mounts routes at /api/*, so default to '/api'.
const API_BASE = (window.API_URL && String(window.API_URL)) || '/api';

// Build safe API URL
function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/api')) return path;
  if (path.startsWith('/'))    return API_BASE + path;
  return API_BASE + '/' + path.replace(/^\/+/, '');
}

// ==== Fetch helper ====
async function apiFetch(path, { method='GET', headers={}, body } = {}) {
  const url  = apiUrl(path);
  const opts = { method, headers: { Accept:'application/json', ...headers } };

  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const token = getToken();
  if (token) opts.headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, opts);
  const ct = res.headers.get('content-type') || '';
  const isJSON = ct.includes('application/json');
  const data = isJSON ? await res.json().catch(()=> ({})) : await res.text();

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) { clearToken(); clearUserId(); }
    const msg = (isJSON && (data?.error || data?.message)) || res.statusText || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ==== Small DOM helpers ====
function setText(el, txt){ if (el) el.textContent = txt; }
function show(el){ if (el) el.style.display = ''; }
function hide(el){ if (el) el.style.display = 'none'; }

// ==== Login (index.html) ====
async function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const msg = document.getElementById('loginMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hide(msg); setText(msg,'');

    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    if (!email || !password) { show(msg); setText(msg,'Email and password required'); return; }

    try {
      const out = await apiFetch('users/login', { method:'POST', body:{ email, password } });
      const token  = out?.token || out?.data?.token;
      const userId = String(out?.user?.id ?? out?.data?.user?.id ?? '');

      if (!token || !userId) { show(msg); setText(msg,'Login succeeded but token/userId missing.'); return; }

      setToken(token); setUserId(userId);
      localStorage.setItem('cc_me', JSON.stringify(out.user || out.data?.user || {}));

      const params = new URLSearchParams(location.search);
      const from = params.get('from');
      location.replace(from || 'profile.html');
    } catch (err) {
      show(msg); setText(msg, err.message || 'Login failed');
    }
  });
}

// ==== OPTIONAL: public services list / create helpers (used by services page if you want) ====
// left as-is — safe to keep for reuse.

// ==== Boot per page ====
document.addEventListener('DOMContentLoaded', async () => {
  await initLoginPage();
});
