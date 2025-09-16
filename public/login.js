const API_URL = 'https://codecrowds.onrender.com';
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const message = document.getElementById('loginMessage');

    if (!email || !password) return message.textContent = 'All fields are required';

    try {
        const res = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Login failed');

        // Save token & user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('username', data.user.username);

        // Redirect to profile
        window.location.href = 'profile.html';
    } catch (err) {
        console.error('Login error:', err);
        message.textContent = err.message;
    }
});
