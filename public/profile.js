// public/profile.js
// Profile page logic: profile info + edit, create service dropdown,
// and show services (for now: show all services from /services).

// Safe localStorage helpers
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_DESCRIPTION =
    "Write a short bio so clients know what you do.";

  // ---------------- Profile display (top card) ----------------
  const storedUsername = safeGet("username") || "";
  const storedEmail = safeGet("email") || "";
  const storedDescription = safeGet("description") || "";

  const params = new URLSearchParams(window.location.search);
  const paramUsername = params.get("username") || "";
  const paramEmail = params.get("email") || "";

  const username = storedUsername || paramUsername || "";
  const email = storedEmail || paramEmail || "";
  const description = storedDescription || "";

  const avatarEl = document.getElementById("profileAvatar");
  const emailBadge = document.getElementById("profileEmail");
  const emailMain = document.getElementById("profileEmailMain");
  const nameEl = document.getElementById("profileName");
  const descEl = document.getElementById("profileDescription");

  // Fill view mode
  if (email && emailBadge && emailMain) {
    emailBadge.textContent = email;
    emailMain.textContent = email;
  }

  let displayName = username;
  if (!displayName && email) {
    displayName = email.split("@")[0];
  }
  if (displayName && nameEl) {
    nameEl.textContent = displayName;
  }

  if (descEl) {
    descEl.textContent = description || DEFAULT_DESCRIPTION;
  }

  const initialSource = displayName || email || "U";
  if (avatarEl && initialSource) {
    avatarEl.textContent = initialSource.trim()[0].toUpperCase();
  }

  // ---------------- Edit profile behaviour ----------------
  const profileView = document.getElementById("profileView");
  const profileEditForm = document.getElementById("profileEditForm");
  const editBtn = document.getElementById("editProfileBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const editDisplayNameInput = document.getElementById("editDisplayName");
  const editEmailInput = document.getElementById("editEmail");
  const editDescriptionInput = document.getElementById("editDescription");

  function enterEditMode() {
    if (!profileView || !profileEditForm) return;

    if (editDisplayNameInput && nameEl) {
      editDisplayNameInput.value = nameEl.textContent.trim();
    }
    if (editEmailInput && emailMain) {
      editEmailInput.value = emailMain.textContent.trim();
    }
    if (editDescriptionInput && descEl) {
      const current = descEl.textContent.trim();
      editDescriptionInput.value =
        current === DEFAULT_DESCRIPTION ? "" : current;
    }

    profileView.classList.add("is-hidden");
    profileEditForm.classList.remove("is-hidden");
  }

  function exitEditMode() {
    if (!profileView || !profileEditForm) return;
    profileEditForm.classList.add("is-hidden");
    profileView.classList.remove("is-hidden");
  }

  if (editBtn) {
    editBtn.addEventListener("click", enterEditMode);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", exitEditMode);
  }

  if (profileEditForm) {
    profileEditForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!editEmailInput) return;

      const newName = editDisplayNameInput
        ? editDisplayNameInput.value.trim()
        : "";
      const newEmail = editEmailInput.value.trim();
      const newDescription = editDescriptionInput
        ? editDescriptionInput.value.trim()
        : "";

      if (!newEmail) {
        alert("Email is required.");
        editEmailInput.focus();
        return;
      }

      // Update UI
      if (nameEl) {
        nameEl.textContent = newName || "New developer";
      }
      if (emailBadge) {
        emailBadge.textContent = newEmail;
      }
      if (emailMain) {
        emailMain.textContent = newEmail;
      }
      if (descEl) {
        descEl.textContent = newDescription || DEFAULT_DESCRIPTION;
      }

      // Avatar
      if (avatarEl) {
        const source = (newName || newEmail || "U").trim();
        avatarEl.textContent = source[0].toUpperCase();
      }

      // Persist (UI only)
      safeSet("email", newEmail);
      const usernameToStore = newName || newEmail.split("@")[0];
      safeSet("username", usernameToStore);
      safeSet("description", newDescription);

      exitEditMode();
    });
  }

  // ---------------- Create Service dropdown + submit ----------------
  const createServiceBtn = document.getElementById("createServiceBtn");
  const createServiceForm = document.getElementById("createServiceForm");
  const cancelCreateServiceBtn = document.getElementById(
    "cancelCreateServiceBtn"
  );

  // Toggle dropdown
  if (createServiceBtn && createServiceForm) {
    createServiceBtn.addEventListener("click", () => {
      createServiceForm.classList.toggle("is-hidden");
    });
  }

  // Cancel hides dropdown
  if (cancelCreateServiceBtn && createServiceForm) {
    cancelCreateServiceBtn.addEventListener("click", () => {
      createServiceForm.classList.add("is-hidden");
    });
  }

  // Create service submit
  if (createServiceForm) {
    createServiceForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titleEl = document.getElementById("serviceTitle");
      const priceEl = document.getElementById("servicePrice");
      const descElService = document.getElementById("serviceDescription");

      const title = titleEl ? titleEl.value.trim() : "";
      const priceValue = priceEl ? priceEl.value.trim() : "";
      const descriptionService = descElService
        ? descElService.value.trim()
        : "";

      if (!title || !priceValue || !descriptionService) {
        alert("Please fill in all service fields.");
        return;
      }

      const price = Number(priceValue);
      if (Number.isNaN(price) || price <= 0) {
        alert("Please enter a valid price.");
        return;
      }

      const baseUrl = window.API_URL || "";
      const headers = { "Content-Type": "application/json" };

      // Try to attach token if it exists
      const token =
        safeGet("token") ||
        safeGet("authToken") ||
        safeGet("jwt") ||
        safeGet("accessToken");
      if (token) {
        headers.Authorization = "Bearer " + token;
      }

      try {
        const res = await fetch(baseUrl + "/services", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title,
            price,
            description: descriptionService,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const msg =
            errJson.message ||
            `Failed to create service (status ${res.status}).`;
          throw new Error(msg);
        }

        alert("Service created successfully!");
        createServiceForm.reset();
        createServiceForm.classList.add("is-hidden");

        // Reload list so the new service shows under "Your services"
        loadServicesForProfile();
      } catch (err) {
        console.error(err);
        alert(err.message || "Something went wrong creating the service.");
      }
    });
  }

  // ---------------- Load services for profile (show ALL for now) ----------------
  async function loadServicesForProfile() {
    const listEl = document.getElementById("profileServicesList");
    const emptyEl = document.getElementById("profileServicesEmpty");
    if (!listEl || !emptyEl) return;

    listEl.innerHTML = ""; // clear any previous content

    let services = [];
    try {
      if (typeof window.apiFetch === "function") {
        // Use shared helper from script.js if available
        const response = await window.apiFetch("services");
        if (Array.isArray(response)) {
          services = response;
        } else if (response && Array.isArray(response.data)) {
          services = response.data;
        }
      } else {
        // Fallback: plain fetch
        const baseUrl = window.API_URL || "";
        const res = await fetch(baseUrl + "/services");
        const json = await res.json();
        if (Array.isArray(json)) {
          services = json;
        } else if (json && Array.isArray(json.data)) {
          services = json.data;
        }
      }
    } catch (err) {
      console.error("Failed to load services on profile page:", err);
      emptyEl.classList.remove("is-hidden");
      return;
    }

    if (!services.length) {
      // No services at all
      emptyEl.classList.remove("is-hidden");
      return;
    }

    // We have services – hide the empty text
    emptyEl.classList.add("is-hidden");

    // For now: show ALL services (same as services.html),
    // we can tighten this to "only my services" later.
    services.forEach((svc) => {
      const card = document.createElement("div");
      card.className = "profile-service-card";

      const titleDiv = document.createElement("div");
      titleDiv.className = "profile-service-title";
      titleDiv.textContent = svc.title || "Untitled service";
      card.appendChild(titleDiv);

      const metaDiv = document.createElement("div");
      metaDiv.className = "profile-service-meta";

      // Price
      const price = Number(svc.price || 0);
      const priceSpan = document.createElement("span");
      priceSpan.textContent = `Price: $${price.toLocaleString()}`;
      metaDiv.appendChild(priceSpan);

      // Optional description
      if (svc.description) {
        const descSpan = document.createElement("span");
        descSpan.textContent = `  •  ${svc.description}`;
        metaDiv.appendChild(descSpan);
      }

      card.appendChild(metaDiv);
      listEl.appendChild(card);
    });
  }

  // Initial load
  loadServicesForProfile();
});
