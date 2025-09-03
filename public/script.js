const API_URL = 'http://localhost:3000';

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    alert(data.message || data.error);
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    alert(data.message || data.error);
});

// Load services
async function loadServices() {
    const res = await fetch(`${API_URL}/services`);
    const services = await res.json();

    const list = document.getElementById('services-list');
    list.innerHTML = '';
    services.forEach(s => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${s.title}</strong> by ${s.User?.username || 'Unknown'}<br>${s.description}<br>Price: $${s.price}<hr>`;
        list.appendChild(div);
    });
}

// Add service
document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('service-title').value;
    const description = document.getElementById('service-description').value;
    const price = parseFloat(document.getElementById('service-price').value);
    const userId = document.getElementById('service-userId').value;

    const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, price, userId })
    });

    const data = await res.json();
    alert(data.message || data.error);
    loadServices();
});

// Load services on page load
loadServices();
