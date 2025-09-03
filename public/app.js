const API_URL = 'http://localhost:3000';

// REGISTER
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = regUsername.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value.trim();
  const res = await fetch(`${API_URL}/users/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  registerMessage.textContent = data.message || data.error;
});

// LOGIN
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  loginMessage.textContent = data.message || data.error;
  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'dashboard.html';
  }
});

// LOAD SERVICES
async function loadServices() {
  const res = await fetch(`${API_URL}/services`);
  const services = await res.json();
  const list = document.getElementById('services-list');
  if (!list) return;
  list.innerHTML = '';
  services.forEach(s => {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${s.title}</strong> by ${s.User?.username}<br>${s.description}<br>Price: $${s.price}<hr>`;
    list.appendChild(div);
  });
}
if (document.getElementById('services-list')) loadServices();

// POST SERVICE
document.getElementById('serviceForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = serviceTitle.value.trim();
  const description = serviceDesc.value.trim();
  const price = servicePrice.value.trim();
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ title, description, price })
  });
  const data = await res.json();
  serviceMessage.textContent = data.message || data.error;
  loadServices();
});
