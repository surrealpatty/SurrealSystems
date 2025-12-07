// public/services.js
// All-services page logic: load services, filter/sort, open message modal, send message.

console.log("[services] loaded services.js v7");

document.addEventListener("DOMContentLoaded", () => {
  // ---- DOM refs ----
  const grid = document.getElementById("servicesGrid");
  const searchInput = document.getElementById("serviceSearch");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortSelect = document.getElementById("sortSelect");

  // Message modal elements (from services.html)
  const msgModal = document.getElementById("msgModal");
  const msgTitle = document.getElementById("msgTitle");
  const msgServiceRef = document.getElementById("msgServiceRef");
  const msgInput = document.getElementById("msgInput");
  const msgCount = document.getElementById("msgCount");
  const sendMsgBtn = document.getElementById("sendMsgBtn");
  const closeMsgBtn = document.getElementById("closeMsgBtn");

  let allServices = [];
  let currentServiceForMessage = null;
  let currentSellerForMessage = null;

  // ---------- Small helpers ----------

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatPrice(price) {
    if (price == null || Number.isNaN(Number(price))) return "";
    const num = Number(price);
    return `$${num.toFixed(2)}`;
  }

  function showToast(message, type = "info") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      // Fallback if toast helper isn’t available
      alert(message);
    }
  }

  // ---------- Load + render services ----------

  async function loadServices() {
    if (!grid) return;

    grid.innerHTML =
      '<div class="services-loading">Loading services…</div>';

    try {
      // apiFetch is defined in public/script.js
      const json = await apiFetch("/services");

      // Our backend list route returns { success, rows, count, data: { rows, count } }
      const rows = Array.isArray(json?.rows)
        ? json.rows
        : Array.isArray(json)
        ? json
        : [];

      allServices = rows;
      renderServices();
    } catch (err) {
      console.error("[services] failed to load services", err);
      grid.innerHTML =
        '<div class="services-error">Could not load services. Please try again.</div>';
    }
  }

  function applyFilters(services) {
    let out = [...services];

    const q = (searchInput?.value || "").trim().toLowerCase();
    if (q) {
      out = out.filter((svc) => {
        const title = (svc.title || "").toLowerCase();
        const desc = (svc.description || "").toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }

    const cat = categoryFilter?.value;
    if (cat && cat !== "all") {
      out = out.filter((svc) => (svc.category || "") === cat);
    }

    const sort = sortSelect?.value;
    if (sort === "price-asc") {
      out.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "price-desc") {
      out.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === "newest") {
      out.sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime();
        const db = new Date(b.createdAt || 0).getTime();
        return db - da;
      });
    }

    return out;
  }

  function renderServices() {
    if (!grid) return;

    const list = applyFilters(allServices);

    if (!list.length) {
      grid.innerHTML =
        '<div class="services-empty">No services found. Try adjusting your filters.</div>';
      return;
    }

    const fragments = document.createDocumentFragment();

    list.forEach((svc) => {
      const card = document.createElement("article");
      card.className = "service-card";

      const sellerUser =
        svc.user ||
        svc.User || // just in case
        null;

      const sellerName =
        (sellerUser && (sellerUser.displayName || sellerUser.username)) ||
        "Unknown user";

      card.innerHTML = `
        <h3 class="service-title">${escapeHtml(
          svc.title || "Untitled service"
        )}</h3>
        <p class="service-description">${escapeHtml(
          svc.description || ""
        )}</p>

        <div class="service-meta">
          <span class="service-seller">Posted by: ${escapeHtml(
            sellerName
          )}</span>
          ${
            svc.price != null
              ? `<span class="service-price">${formatPrice(
                  svc.price
                )}</span>`
              : ""
          }
        </div>

        <div class="service-actions">
          <button type="button" class="btn-outline service-message-btn">
            Message
          </button>
        </div>
      `;

      const messageBtn = card.querySelector(".service-message-btn");
      if (messageBtn) {
        messageBtn.addEventListener("click", () => {
          openMessageModal(svc, sellerUser, sellerName);
        });
      }

      fragments.appendChild(card);
    });

    grid.innerHTML = "";
    grid.appendChild(fragments);
  }

  // ---------- Message modal logic ----------

  function openMessageModal(service, sellerUser, sellerName) {
    if (!msgModal || !msgInput || !msgTitle || !msgServiceRef) return;

    currentServiceForMessage = service || null;
    currentSellerForMessage = sellerUser || null;

    const displayName =
      (sellerUser && (sellerUser.displayName || sellerUser.username)) ||
      sellerName ||
      "seller";

    msgTitle.textContent = `Message ${displayName}`;
    msgServiceRef.textContent = `Regarding: "${service?.title || "this service"}"`;

    msgInput.value = "";
    if (msgCount) msgCount.textContent = "0";

    msgModal.classList.remove("hidden");
    msgInput.focus();
  }

  function closeMessageModal() {
    if (!msgModal) return;
    msgModal.classList.add("hidden");
    currentServiceForMessage = null;
    currentSellerForMessage = null;
  }

  async function handleSendMessage() {
    if (!currentServiceForMessage || !currentSellerForMessage) {
      // Nothing selected, just close.
      closeMessageModal();
      return;
    }

    const content = (msgInput?.value || "").trim();
    if (!content) {
      showToast("Please write a message before sending.", "error");
      return;
    }

    if (sendMsgBtn) sendMsgBtn.disabled = true;

    try {
      await apiFetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: currentSellerForMessage.id,
          serviceId: currentServiceForMessage.id,
          content,
        }),
      });

      showToast("Message sent!", "success");
      closeMessageModal();
    } catch (err) {
      console.error("[services] failed to send message", err);
      showToast("Sorry, we couldn’t send your message.", "error");
    } finally {
      if (sendMsgBtn) sendMsgBtn.disabled = false;
    }
  }

  // ---------- Event wiring ----------

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderServices();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      renderServices();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      renderServices();
    });
  }

  if (msgInput && msgCount) {
    msgInput.addEventListener("input", () => {
      msgCount.textContent = String(msgInput.value.length);
    });
  }

  if (closeMsgBtn) {
    closeMsgBtn.addEventListener("click", closeMessageModal);
  }

  if (msgModal) {
    msgModal.addEventListener("click", (evt) => {
      if (evt.target === msgModal) {
        // click on dark backdrop closes modal
        closeMessageModal();
      }
    });
  }

  if (sendMsgBtn) {
    sendMsgBtn.addEventListener("click", handleSendMessage);
  }

  // ---------- Init ----------

  loadServices();
});
