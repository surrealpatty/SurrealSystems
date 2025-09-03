const API_URL = 'http://localhost:3000'; // backend URL

// Handle registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const messageEl = document.getElementById('registerMessage');

  try {
    const res = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      messageEl.textContent = data.message;
      messageEl.className = 'message success';
      document.getElementById('registerForm').reset();
    } else {
      messageEl.textContent = data.error;
      messageEl.className = 'message error';
    }
  } catch (err) {
    messageEl.textContent = err.message;
    messageEl.className = 'message error';
  }
});
