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
// ---------- Profile services logic (add at bottom of public/profile.js) ----------
(function () {
  // Safely escape text for HTML
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Try to get the current user's ID from localStorage or JWT
  function getCurrentUserId() {
    if (typeof window === "undefined") return null;
    try {
      // 1) Simple key: userId
      const direct = localStorage.getItem("userId");
      if (direct) {
        const n = Number(direct);
        return Number.isFinite(n) ? n : direct;
      }

      // 2) Stored user object, e.g. "codecrowds:user"
      const storedUser = localStorage.getItem("codecrowds:user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.id != null) return parsed.id;
        } catch (_) {
          // ignore parse errors
        }
      }

      // 3) Fallback: decode JWT and look for id
      const token = localStorage.getItem("token");
      if (token && token.split(".").length === 3) {
        const payloadBase64 = token.split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/");
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        if (payload && payload.id != null) return payload.id;
      }
    } catch (err) {
      console.error("Error while resolving current user ID:", err);
    }
    return null;
  }

  async function loadProfileServices() {
    const listEl = document.getElementById("profileServicesList");
    const emptyEl = document.getElementById("profileServicesEmpty");

    if (!listEl || !emptyEl) {
      // Not on the profile page or IDs changed
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      // We can't figure out who the user is – show empty message
      emptyEl.classList.remove("is-hidden");
      listEl.innerHTML = "";
      console.warn("No current user ID found – cannot load profile services.");
      return;
    }

    try {
      // Uses your existing list route:
      // GET /api/services?userId=123&limit=50
      const result = await apiFetch(
        `/services?userId=${encodeURIComponent(userId)}&limit=50`
      );

      // apiFetch probably returns { services, hasMore, ... }
      const services = Array.isArray(result)
        ? result
        : result?.services || [];

      listEl.innerHTML = "";

      if (!services.length) {
        // No services – show empty state
        emptyEl.classList.remove("is-hidden");
        return;
      }

      // We have services – hide empty state
      emptyEl.classList.add("is-hidden");

      services.forEach((svc) => {
        const card = document.createElement("article");
        card.className = "profile-service-card";

        const price =
          svc.price != null && svc.price !== ""
            ? Number(svc.price).toLocaleString()
            : "N/A";

        card.innerHTML = `
          <div class="profile-service-title">
            ${escapeHtml(svc.title || "Untitled service")}
          </div>
          <div class="profile-service-meta">
            ${escapeHtml(svc.description || "")}
          </div>
          <div class="profile-service-meta">
            Price: $${price}
          </div>
        `;

        listEl.appendChild(card);
      });
    } catch (err) {
      console.error("Failed to load profile services:", err);
      emptyEl.classList.remove("is-hidden");
      emptyEl.textContent =
        "Could not load your services right now. Please try again.";
      listEl.innerHTML = "";
    }
  }

  async function handleCreateServiceSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const titleInput = document.getElementById("serviceTitle");
    const priceInput = document.getElementById("servicePrice");
    const descInput = document.getElementById("serviceDescription");

    if (!titleInput || !priceInput || !descInput) {
      console.error("Service form inputs not found.");
      return;
    }

    const title = titleInput.value.trim();
    const priceRaw = priceInput.value.trim();
    const description = descInput.value.trim();

    if (!title) {
      alert("Please enter a service title.");
      return;
    }

    if (!priceRaw) {
      alert("Please enter a price.");
      return;
    }

    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
      alert("Please enter a valid price greater than 0.");
      return;
    }

    try {
      // POST /api/services (auth required)
      await apiFetch("/services", {
        method: "POST",
        auth: true,
        body: {
          title,
          description,
          price,
        },
      });

      // Reset form + hide it
      form.reset();
      form.classList.add("is-hidden");

      // Reload the user's services so the new one appears
      await loadProfileServices();
    } catch (err) {
      console.error("Failed to create service:", err);
      alert("Could not create service. Please try again.");
    }
  }

  function initProfileServices() {
    const listEl = document.getElementById("profileServicesList");
    const emptyEl = document.getElementById("profileServicesEmpty");

    // If these don't exist, we're not on the profile page – do nothing
    if (!listEl || !emptyEl) return;

    const createBtn = document.getElementById("createServiceBtn");
    const createForm = document.getElementById("createServiceForm");
    const cancelCreateBtn = document.getElementById(
      "cancelCreateServiceBtn"
    );

    // Load current user's services on page load
    loadProfileServices();

    // Toggle create service form
    if (createBtn && createForm) {
      createBtn.addEventListener("click", () => {
        const isHidden = createForm.classList.contains("is-hidden");
        if (isHidden) {
          createForm.classList.remove("is-hidden");
        } else {
          createForm.classList.add("is-hidden");
        }
      });
    }

    // Cancel create service
    if (cancelCreateBtn && createForm) {
      cancelCreateBtn.addEventListener("click", () => {
        createForm.classList.add("is-hidden");
        createForm.reset();
      });
    }

    // Handle form submit
    if (createForm) {
      createForm.addEventListener("submit", handleCreateServiceSubmit);
    }
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProfileServices);
  } else {
    initProfileServices();
  }
})();
