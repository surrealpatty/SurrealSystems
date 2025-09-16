const API_URL = 'https://codecrowds.onrender.com';

// ---------- Helpers ----------
function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in. Redirecting to login page.');
        window.location.href = 'index.html';
    }
    return token;
}

// ---------- Profile ----------
const usernameInput = document.getElementById('username');
const descInput = document.getElementById('description');
const usernameDisplay = document.getElementById('usernameDisplay');
const editBtn = document.getElementById('editProfileBtn');

let editing = false;

async function loadProfile() {
    const token = getToken();
    try {
        const res = await fetch(`${API_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load profile');
        
        usernameInput.value = data.username || '';
        descInput.value = data.description || '';
        usernameDisplay.textContent = data.username || 'User';
    } catch (err) {
        console.error('Load profile error:', err);
        alert('Failed to load profile. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }
}

loadProfile();

editBtn.addEventListener('click', async () => {
    const token = getToken();
    if (!editing) {
        usernameInput.removeAttribute('readonly');
        descInput.removeAttribute('readonly');
        editBtn.textContent = 'Save Profile';
        editing = true;
    } else {
        const username = usernameInput.value.trim();
        const description = descInput.value.trim();

        if (!username) return alert('Username cannot be empty');

        try {
            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, description })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update profile');

            usernameDisplay.textContent = data.username;
            usernameInput.setAttribute('readonly', true);
            descInput.setAttribute('readonly', true);
            editBtn.textContent = 'Edit Profile';
            editing = false;

            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Profile update error:', err);
            alert('Error saving profile: ' + err.message);
        }
    }
});

// ---------- Services ----------
const serviceForm = document.getElementById('serviceForm');
const servicesList = document.getElementById('services-list');

async function loadServices() {
    const token = getToken();
    try {
        const res = await fetch(`${API_URL}/services`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const services = await res.json();
        if (!res.ok) throw new Error(services.message || 'Failed to load services');

        servicesList.innerHTML = '';
        services.forEach(service => {
            const div = document.createElement('div');
            div.className = 'service-card';
            div.innerHTML = `
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <p><strong>$${service.price}</strong></p>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            `;
            div.querySelector('.edit-btn').addEventListener('click', () => editService(service));
            div.querySelector('.delete-btn').addEventListener('click', () => deleteService(service.id));
            servicesList.appendChild(div);
        });
    } catch (err) {
        console.error('Load services error:', err);
        servicesList.innerHTML = `<p class="error">Failed to load services</p>`;
    }
}

loadServices();

serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getToken();
    const title = document.getElementById('service-title').value.trim();
    const description = document.getElementById('service-description').value.trim();
    const price = parseFloat(document.getElementById('service-price').value);

    if (!title || !description || isNaN(price)) return alert('All fields are required');

    try {
        const res = await fetch(`${API_URL}/services`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, price })
        });
        if (!res.ok) throw new Error('Failed to add service');

        serviceForm.reset();
        loadServices();
    } catch (err) {
        console.error('Add service error:', err);
        alert('Failed to add service: ' + err.message);
    }
});

async function editService(service) {
    const token = getToken();
    const title = prompt('Edit title', service.title);
    const description = prompt('Edit description', service.description);
    const price = parseFloat(prompt('Edit price', service.price));

    if (!title || !description || isNaN(price)) return;

    try {
        const res = await fetch(`${API_URL}/services/${service.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, price })
        });
        if (!res.ok) throw new Error('Failed to update service');
        loadServices();
    } catch (err) {
        console.error('Edit service error:', err);
        alert('Failed to update service: ' + err.message);
    }
}

async function deleteService(id) {
    const token = getToken();
    if (!confirm('Delete this service?')) return;

    try {
        const res = await fetch(`${API_URL}/services/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete service');
        loadServices();
    } catch (err) {
        console.error('Delete service error:', err);
        alert('Failed to delete service: ' + err.message);
    }
}

// ---------- Logout ----------
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});
