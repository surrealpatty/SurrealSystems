const API_URL = "https://codecrowds.onrender.com"; // change if needed

document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token'); // ✅ get JWT from localStorage
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
                'Authorization': `Bearer ${token}` // ✅ attach token
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
