// public/messages.js
// Messages page: show inbox/sent, and for each card a Reply button
// that both shows the conversation thread and lets you send a reply.

(() => {
  console.log("[messages] loaded messages.js (reply + thread)");

  // -----------------------------
  // API base URL helper (Render vs local)
  // -----------------------------
  const AUTO_HOST = "codecrowds.onrender.com";

  const API_URL =
    window.API_URL ||
    (window.location.hostname === AUTO_HOST ||
    window.location.hostname.endsWith(".onrender.com")
      ? `https://${AUTO_HOST}/api`
      : "/api");

  // -----------------------------
  // DOM elements
  // -----------------------------
  const messagesList = document.getElementById("messages-list");
  const inboxBtn = document.getElementById("inboxBtn");
  const sentBtn = document.getElementById("sentBtn");
  const backBtn = document.getElementById("goBackBtn");

  // -----------------------------
  // State
  // -----------------------------
  let currentView = "inbox"; // "inbox" | "sent"
  let inboxMessages = [];
  let sentMessages = [];
  let allMessages = [];
  const messagesById = new Map();

  const currentUserId = getCurrentUserId();

  // -----------------------------
  // Helpers
  // -----------------------------
  function getCurrentUserId() {
    try {
      const raw = localStorage.getItem("userId");
      if (!raw) return null;
      const n = Number(raw);
      return Number.isNaN(n) ? null : n;
    } catch {
      return null;
    }
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function showStatus(text, cls = "loading") {
    if (!messagesList) return;
    messagesList.innerHTML = `<p class="${cls}">${escapeHtml(text)}</p>`;
  }

  function setActiveTab(view) {
    currentView = view;
    if (!inboxBtn || !sentBtn) return;

    inboxBtn.classList.toggle("active", view === "inbox");
    sentBtn.classList.toggle("active", view === "sent");

    inboxBtn.setAttribute("aria-pressed", view === "inbox" ? "true" : "false");
    sentBtn.setAttribute("aria-pressed", view === "sent" ? "true" : "false");
  }

  async function apiGet(path) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`GET ${path} failed: ${res.status}`);
    }
    return res.json();
  }

  async function apiPost(path, body) {
    let token = null;
    try {
      token = localStorage.getItem("token");
    } catch {
      token = null;
    }

    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // ignore parse error
    }

    if (!res.ok) {
      const msg =
        (data && data.error && data.error.message) ||
        data?.message ||
        `Request failed with status ${res.status}`;
      throw new Error(msg);
    }

    return data;
  }

  function normalizeMessages(payload) {
    if (!payload) return [];

    if (Array.isArray(payload.messages)) return payload.messages;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && Array.isArray(payload.data.rows)) return payload.data.rows;
    if (Array.isArray(payload)) return payload;

    return [];
  }

  function indexMessages() {
    allMessages = [...inboxMessages, ...sentMessages];
    messagesById.clear();
    for (const m of allMessages) {
      if (m && m.id != null) {
        messagesById.set(m.id, m);
      }
    }
  }

  // -----------------------------
  // Fetch messages once (inbox + sent)
  // -----------------------------
  async function fetchAllMessages() {
    try {
      showStatus("Loading messages…", "loading");
      const [inboxRaw, sentRaw] = await Promise.all([
        apiGet("/messages/inbox"),
        apiGet("/messages/sent"),
      ]);

      inboxMessages = normalizeMessages(inboxRaw);
      sentMessages = normalizeMessages(sentRaw);
      indexMessages();

      renderView("inbox");
    } catch (err) {
      console.error("[messages] fetchAllMessages failed", err);
      showStatus("Could not load your messages. Please try again.", "error");
    }
  }

  // -----------------------------
  // Rendering
  // -----------------------------
  function renderView(view) {
    setActiveTab(view);

    const list = view === "inbox" ? inboxMessages : sentMessages;

    if (!list.length) {
      showStatus(
        view === "inbox"
          ? "You have no received messages yet."
          : "You have not sent any messages yet.",
        "empty",
      );
      return;
    }

    const html = list.map((m) => renderMessageCard(m, view)).join("");
    messagesList.innerHTML = html;
  }

  function renderMessageCard(m, view) {
    const senderName =
      m.senderName ||
      m.senderUsername ||
      m.sender?.displayName ||
      m.sender?.username ||
      m.sender?.email ||
      "Unknown user";

    const receiverName =
      m.receiverName ||
      m.receiverUsername ||
      m.receiver?.displayName ||
      m.receiver?.username ||
      m.receiver?.email ||
      "";

    const whoLine =
      view === "inbox"
        ? `From: ${senderName}`
        : receiverName
        ? `To: ${receiverName}`
        : "Sent message";

    const otherUserId = (() => {
      const sId = m.senderId ?? m.sender_id;
      const rId = m.receiverId ?? m.receiver_id;
      if (currentUserId != null && sId === currentUserId) return rId;
      if (currentUserId != null && rId === currentUserId) return sId;
      // fallback: for inbox view, other is sender; for sent view, other is receiver
      return view === "inbox" ? sId : rId;
    })();

    const previewRaw =
      m.preview || m.snippet || m.content || m.text || "";
    const preview =
      previewRaw.length > 220
        ? `${previewRaw.slice(0, 217)}…`
        : previewRaw;

    const when = formatDate(m.createdAt || m.sentAt || m.created_at);

    const msgId = m.id || m.messageId || m.messageID || "";
    const serviceId = m.serviceId || m.service_id || "";

    const subjectDisplay = `RE 'Message from ${senderName}'`;

    return `
      <article class="message-card" data-message-id="${escapeHtml(
        String(msgId),
      )}">
        <div class="message-main">
          <h3 class="message-title">${escapeHtml(subjectDisplay)}</h3>
          <p class="message-meta">${escapeHtml(whoLine)}</p>
          <p class="message-snippet">${escapeHtml(preview)}</p>
          <p class="timestamp">${escapeHtml(when)}</p>

          <div class="conversation-footer">
            <!-- This is the ONLY button you see: looks like old "View Conversation" but says Reply -->
            <button
              type="button"
              class="reply-toggle"
            >
              Reply
            </button>
          </div>
        </div>

        <!-- Conversation panel: hidden until you click Reply -->
        <div
          class="conversation-panel"
          hidden
          data-partner-id="${escapeHtml(String(otherUserId ?? ""))}"
          data-service-id="${escapeHtml(String(serviceId ?? ""))}"
        >
          <div class="thread-messages"></div>
          <div class="thread-reply">
            <textarea
              class="thread-reply-input"
              placeholder="Type your reply…"
            ></textarea>
            <button type="button" class="thread-send-btn">Send</button>
          </div>
        </div>
      </article>
    `;
  }

  // -----------------------------
  // Conversation building
  // -----------------------------
  function inSameConversation(msg, partnerId, serviceId) {
    const sId = msg.senderId ?? msg.sender_id;
    const rId = msg.receiverId ?? msg.receiver_id;
    const svc = msg.serviceId ?? msg.service_id ?? null;

    const samePair =
      currentUserId != null &&
      ((sId === currentUserId && rId === partnerId) ||
        (sId === partnerId && rId === currentUserId));

    const sameService =
      !serviceId || !svc || Number(svc) === Number(serviceId);

    return samePair && sameService;
  }

  function buildThreadHtml(partnerId, serviceId) {
    const partnerIdNum =
      partnerId == null || partnerId === "" ? null : Number(partnerId);

    const thread = allMessages
      .filter(
        (m) =>
          partnerIdNum != null && inSameConversation(m, partnerIdNum, serviceId),
      )
      .sort((a, b) => {
        const da = new Date(a.createdAt || a.created_at);
        const db = new Date(b.createdAt || b.created_at);
        return da - db;
      });

    if (!thread.length) {
      return `<p class="thread-empty">No previous messages in this conversation yet.</p>`;
    }

    return thread
      .map((m) => {
        const sId = m.senderId ?? m.sender_id;
        const isMe = currentUserId != null && sId === currentUserId;

        const name =
          isMe
            ? "You"
            : m.sender?.displayName ||
              m.sender?.username ||
              m.sender?.email ||
              "Them";

        const when = formatDate(m.createdAt || m.created_at);
        const text = m.content || m.text || "";

        return `
          <div class="thread-message ${isMe ? "from-you" : "from-them"}">
            <div class="thread-meta">
              <span class="thread-author">${escapeHtml(name)}</span>
              <span class="thread-time">${escapeHtml(when)}</span>
            </div>
            <p class="thread-text">${escapeHtml(text)}</p>
          </div>
        `;
      })
      .join("");
  }

  function openConversationPanel(articleEl) {
    const panel = articleEl.querySelector(".conversation-panel");
    if (!panel) return;

    // Build thread content
    const partnerId = panel.getAttribute("data-partner-id");
    const serviceId = panel.getAttribute("data-service-id") || "";
    const messagesBox = panel.querySelector(".thread-messages");
    const textarea = panel.querySelector(".thread-reply-input");

    if (messagesBox) {
      messagesBox.innerHTML = buildThreadHtml(partnerId, serviceId);
    }

    panel.hidden = false;
    if (textarea) textarea.focus();
  }

  function closeConversationPanel(articleEl) {
    const panel = articleEl.querySelector(".conversation-panel");
    if (!panel) return;
    panel.hidden = true;
  }

  async function sendReplyFromPanel(articleEl) {
    const panel = articleEl.querySelector(".conversation-panel");
    if (!panel) return;

    const partnerIdRaw = panel.getAttribute("data-partner-id");
    const serviceIdRaw = panel.getAttribute("data-service-id") || "";
    const partnerId = partnerIdRaw ? Number(partnerIdRaw) : null;
    const serviceId = serviceIdRaw ? Number(serviceIdRaw) : null;

    const textarea = panel.querySelector(".thread-reply-input");
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) {
      alert("Your reply cannot be empty.");
      return;
    }

    if (!partnerId) {
      alert("Cannot send reply: missing receiver.");
      return;
    }

    const payload = {
      content,
      receiverId: partnerId,
    };
    if (serviceId) {
      payload.serviceId = serviceId;
    }

    try {
      const res = await apiPost("/messages", payload);

      // Try to grab the created message out of the response
      const created =
        (res && res.data) ||
        (res && res.message) ||
        res;

      if (created && created.id != null) {
        // Treat this as a new sent message
        sentMessages.push(created);
        indexMessages();
      }

      textarea.value = "";

      // Rebuild thread so the new message appears
      const messagesBox = panel.querySelector(".thread-messages");
      if (messagesBox) {
        messagesBox.innerHTML = buildThreadHtml(partnerId, serviceId);
      }

      // If you're on Sent tab, re-render list so the card list updates
      if (currentView === "sent") {
        renderView("sent");
      }
    } catch (err) {
      console.error("[messages] sendReply failed", err);
      alert(err.message || "Failed to send reply.");
    }
  }

  // -----------------------------
  // Event wiring
  // -----------------------------
  function setupEvents() {
    if (inboxBtn) {
      inboxBtn.addEventListener("click", (e) => {
        e.preventDefault();
        renderView("inbox");
      });
    }

    if (sentBtn) {
      sentBtn.addEventListener("click", (e) => {
        e.preventDefault();
        renderView("sent");
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/profile.html";
      });
    }

    // Delegate clicks for dynamic message cards
    document.addEventListener("click", (e) => {
      const target = e.target;

      // Click on the blue Reply button
      if (target.classList.contains("reply-toggle")) {
        const article = target.closest(".message-card");
        if (!article) return;

        const panel = article.querySelector(".conversation-panel");
        if (!panel) return;

        if (panel.hidden) {
          openConversationPanel(article);
        } else {
          closeConversationPanel(article);
        }
      }

      // Click on "Send" inside conversation panel
      if (target.classList.contains("thread-send-btn")) {
        const article = target.closest(".message-card");
        if (!article) return;
        sendReplyFromPanel(article);
      }
    });
  }

  // -----------------------------
  // Init
  // -----------------------------
  document.addEventListener("DOMContentLoaded", () => {
    setupEvents();
    fetchAllMessages();
  });
})();
