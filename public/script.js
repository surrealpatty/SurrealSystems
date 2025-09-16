const API_URL = "http://localhost:3000"; // change if different

// ---------- Safe Fetch ----------
async function safeFetch(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
            const err = await res.json();
            if (err.message) msg = err.message;
        } catch {}
        throw new Error(msg);
    }
    return res.json();
}

// ---------- Token Helpers ----------
function getFreshToken() {
    return localStorage.getItem("token");
}
function getUserId() {
    return localStorage.getItem("userId");
}

// ---------- Signup ----------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("signupUsername").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value.trim();

        try {
            const data = await safeFetch(`${API_URL}/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            document.getElementById("signupMessage").textContent =
                "Registration successful. Please log in.";
            signupForm.reset();
        } catch (err) {
            document.getElementById("signupMessage").textContent = err.message;
        }
    });
}

// ---------- Login ----------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();

        try {
            const data = await safeFetch(`${API_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            // Save token + user info
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("description", data.user.description || "");

            window.location.href = "profile.html";
        } catch (err) {
            document.getElementById("loginMessage").textContent = err.message;
        }
    });
}

// ---------- Profile ----------
const saveProfileBtn = document.getElementById("saveProfile");
if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
        const newUsername = document.getElementById("profileUsername").value.trim();
        const newDesc = document.getElementById("profileDesc").value.trim();
        const token = getFreshToken();
        const userId = getUserId();

        if (!token || !userId) {
            alert("You must be logged in.");
            return;
        }

        try {
            const data = await safeFetch(`${API_URL}/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ username: newUsername, description: newDesc })
            });

            // Update localStorage
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("description", data.user.description || "");

            document.getElementById("profileMessage").textContent = "Profile updated!";
        } catch (err) {
            document.getElementById("profileMessage").textContent =
                "Error saving profile: " + err.message;
        }
    });
}

// Load profile data on page load
if (document.getElementById("profileUsername")) {
    const username = localStorage.getItem("username") || "";
    const description = localStorage.getItem("description") || "";
    document.getElementById("profileUsername").value = username;
    document.getElementById("profileDesc").value = description;
}

// ---------- Services ----------
const addServiceForm = document.getElementById("addServiceForm");
if (addServiceForm) {
    addServiceForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("serviceTitle").value.trim();
        const description = document.getElementById("serviceDesc").value.trim();
        const price = document.getElementById("servicePrice").value.trim();

        const token = getFreshToken();
        if (!token) {
            alert("You must be logged in.");
            return;
        }

        try {
            await safeFetch(`${API_URL}/services`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, price })
            });

            addServiceForm.reset();
            loadServices();
        } catch (err) {
            document.getElementById("serviceMessage").textContent = err.message;
        }
    });
}

async function loadServices() {
    const servicesList = document.getElementById("servicesList");
    if (!servicesList) return;

    try {
        const services = await safeFetch(`${API_URL}/services`);
        servicesList.innerHTML = services
            .map(
                (s) => `
                <div class="service">
                    <h3>${s.title}</h3>
                    <p>${s.description}</p>
                    <p><strong>$${s.price}</strong></p>
                </div>
            `
            )
            .join("");
    } catch (err) {
        servicesList.innerHTML = "Error loading services: " + err.message;
    }
}

if (document.getElementById("servicesList")) {
    loadServices();
}
