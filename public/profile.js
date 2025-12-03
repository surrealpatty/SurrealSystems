// public/profile.js
// Profile page logic: load name/email/description, edit + save,
// create services, and show this user's services under "Your services".

document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_DESCRIPTION =
    "Write a short bio so clients know what you do.";

  // ---- Load profile from localStorage or URL ----
  const storedUsername = localStorage.getItem("username") || "";
  const storedEmail = localStorage.getItem("email") || "";
  const storedDescription = localStorage.getItem("description") || "";

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

  // --- Fill view mode ---
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

  // ---------------------------------------------------------------------------
  // Edit Profile behaviour
  // ---------------------------------------------------------------------------
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

      // Update avatar initial
      if (avatarEl) {
        const source = (newName || newEmail || "U").trim();
        avatarEl.textContent = source[0].toUpperCase();
      }

      // Persist to localStorage
      try {
        localStorage.setItem("email", newEmail);
        const usernameToStore = newName || newEmail.split("@")[0];
        localStorage.setItem("username", usernameToStore);
        localStorage.setItem("description", newDescription);
      } catch (err) {
        console.warn("Could not save updated profile to localStorage", err);
      }

      exitEditMode();
    });
  }

  // ---------------------------------------------------------------------------
  // Load this user's services and show them under "Your services"
  // ---------------------------------------------------------------------------
  async function loadMyServices() {
    const listEl = document.getElementById("profileServicesList");
    const emptyEl = document.getElementById("servicesEmpty");
    if (!listEl) return;

    listEl.innerHTML = "";

    const currentUserId =
      (typeof getUserId === "function" ? getUserId() : localStorage.getItem("userId")) || "";
    const currentUsername = localStorage.getItem("username") || "";
    const currentEmail = localStorage.getItem("email") || "";

    try {
      if (typeof apiFetch !== "function") {
        console.warn("apiFetch is not available on profile page.");
        return;
      }

      const allServices = await apiFetch("services", {
        method: "GET",
        timeoutMs: 10000,
      });

      const servicesArray = Array.isArray(allServices) ? allServices : [];

      const myServices = servicesArray.filter((svc) => {
        if (!svc) return false;

        // Prefer strict userId match
        if (currentUserId) {
          if (String(svc.userId) === String(currentUserId)) return true;
          if (svc.user && String(svc.user.id) === String(currentUserId)) return true;
        }

        // Fallback: match by username or email from embedded user object
        const owner = svc.user || svc.owner || {};
        const ownerName = owner.username || owner.name || "";
        const ownerEmail = owner.email || "";

        if (
          currentUsername &&
          ownerName &&
          ownerName.toLowerCase() === currentUsername.toLowerCase()
        ) {
          return true;
        }

        if (
          currentEmail &&
          ownerEmail &&
          ownerEmail.toLowerCase() === currentEmail.toLowerCase()
        ) {
          return true;
        }

        return false;
      });

      if (!myServices.length) {
        if (emptyEl) {
          emptyEl.style.display = "block";
        }
        return;
      }

      if (emptyEl) {
        emptyEl.style.display = "block";
        emptyEl.textContent = "Your services:";
      }

      myServices.forEach((svc) => {
        const row = document.createElement("div");
        row.className = "profile-service-item";

        const left = document.createElement("div");
        const titleEl = document.createElement("div");
        titleEl.className = "profile-service-title";
        titleEl.textContent = svc.title || "Untitled service";

        const meta = document.createElement("div");
        meta.className = "profile-service-meta";

        const price = Number(svc.price || 0);
        const priceText = price ? `$${price.toLocaleString()}` : "";
        const descSnippet = (svc.description || "").slice(0, 90);

        meta.textContent = priceText
          ? `${priceText}${descSnippet ? " • " + descSnippet : ""}`
          : descSnippet;

        left.appendChild(titleEl);
        left.appendChild(meta);

        row.appendChild(left);
        listEl.appendChild(row);
      });
    } catch (err) {
      console.error("Failed to load services for profile:", err);
      if (emptyEl) {
        emptyEl.style.display = "block";
        emptyEl.textContent =
          "Could not load your services right now. Please try again in a moment.";
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Create Service dropdown + submit
  // ---------------------------------------------------------------------------
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

  // Cancel button hides dropdown
  if (cancelCreateServiceBtn && createServiceForm) {
    cancelCreateServiceBtn.addEventListener("click", () => {
      createServiceForm.classList.add("is-hidden");
    });
  }

  // Submit service
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

      const currentUserId =
        (typeof getUserId === "function" ? getUserId() : localStorage.getItem("userId")) || "";

      if (!currentUserId || (typeof isLoggedIn === "function" && !isLoggedIn())) {
        alert("Please log in again to create a service.");
        window.location.href = "index.html";
        return;
      }

      try {
        if (typeof apiFetch !== "function") {
          alert("Service API is not available right now.");
          return;
        }

        await apiFetch("services", {
          method: "POST",
          body: {
            title,
            price,
            description: descriptionService,
          },
          timeoutMs: 10000,
        });

        alert("Service created successfully!");

        createServiceForm.reset();
        createServiceForm.classList.add("is-hidden");

        // Reload the list so the new service shows up on the profile
        await loadMyServices();
      } catch (err) {
        console.error(err);
        alert(err.message || "Something went wrong creating the service.");
      }
    });
  }

  // Initial load of user's services
  loadMyServices();
});
