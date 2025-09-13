const API_URL = "https://codecrowds.onrender.com"; // change if needed

// ==========================
// REGISTER
// ==========================
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (!username || !email || !password) {
        return alert("All fields are required!");
    }

    try {
        const res = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();
        console.log("Register response:", data);

        if (res.ok) {
            alert("Registered successfully!");
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('description', data.user.description || '');
            window.location.href = "profile.html"; // redirect after register
        } else {
            alert(data.error || "Registration failed");
        }
    } catch (err) {
        console.error(err);
        alert("Network error: " + err.message);
    }
});

// ==========================
// LOGIN
// ==========================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        return alert("Email & password required!");
    }

    try {
        const res = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("Login response:", data);

        if (res.ok) {
            alert("Login successful!");
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('description', data.user.description || '');
            window.location.href = "profile.html"; // redirect after login
        } else {
            alert(data.error || "Login failed");
        }
    } catch (err) {
        console.error(err);
        alert("Network error: " + err.message);
    }
});

// ==========================
// PROFILE UPDATE
// ==========================
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const username = document.getElementById('profileUsername').value.trim();
    const description = document.getElementById('profileDescription').value.trim();

    if (!userId || !token) {
        return alert("You must be logged in to update your profile!");
    }

    try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, description }),
        });

        const data = await res.json();
        console.log("Update response:", data);

        if (res.ok) {
            alert("Profile updated successfully!");
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('description', data.user.description || '');
        } else {
            alert(data.error || "Update failed");
        }
    } catch (err) {
        console.error(err);
        alert("Network error: " + err.message);
    }
});
