// src/routes/messages.js
// Messaging routes for CodeCrowds

const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");

// Load models defensively so we don't blow up if some are missing
const models = require("../models");
const Message = models.Message;
const User = models.User || null;
const Service = models.Service || null;

const authenticateToken = require("../middlewares/authenticateToken");

// Build a safe include array (only add models that actually exist)
const baseInclude = [];
if (User) {
  baseInclude.push({
    model: User,
    as: "sender",
    attributes: ["id", "username", "email", "displayName"],
  });
  baseInclude.push({
    model: User,
    as: "receiver",
    attributes: ["id", "username", "email", "displayName"],
  });
}
if (Service) {
  baseInclude.push({
    model: Service,
    as: "service",
    attributes: ["id", "title", "name"],
  });
}

// ---------------------------------------------------------------------
// POST /messages  – send a message
// ---------------------------------------------------------------------
router.post("/", authenticateToken, async (req, res) => {
  try {
    if (!Message) {
      return res.status(500).json({ message: "Message model not available." });
    }

    const senderId = req.user && req.user.id;
    let { receiverId, content, serviceId, subject } = req.body;

    if (!senderId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required." });
    }

    if (!content || !String(content).trim()) {
      return res
        .status(400)
        .json({ message: "Message content cannot be empty." });
    }

    receiverId = Number(receiverId);
    if (Number.isNaN(receiverId)) {
      return res
        .status(400)
        .json({ message: "receiverId must be a number." });
    }

    if (serviceId !== undefined && serviceId !== null && serviceId !== "") {
      const n = Number(serviceId);
      serviceId = Number.isNaN(n) ? null : n;
    } else {
      serviceId = null;
    }

    if (!subject || !String(subject).trim()) {
      subject = "Message from CodeCrowds";
    }

    const created = await Message.create({
      content: String(content).trim(),
      senderId,
      receiverId,
      serviceId,
      subject, // ignored if column doesn't exist
    });

    // re-load with includes so front-end has sender/receiver info if possible
    let full = created;
    if (baseInclude.length > 0) {
      full = await Message.findByPk(created.id, { include: baseInclude });
    }

    return res.status(201).json(full);
  } catch (err) {
    console.error("Error creating message:", err);

    if (
      err.name === "SequelizeValidationError" ||
      err.name === "SequelizeUniqueConstraintError"
    ) {
      return res.status(400).json({
        message: "Validation failed",
        details: err.errors?.map((e) => e.message) || [],
      });
    }

    return res.status(500).json({ message: "Failed to send message." });
  }
});

// ---------------------------------------------------------------------
// GET /messages/inbox – all messages received by current user
// ---------------------------------------------------------------------
router.get("/inbox", authenticateToken, async (req, res) => {
  try {
    if (!Message) {
      return res.status(500).json({ message: "Message model not available." });
    }

    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const messages = await Message.findAll({
      where: { receiverId: userId },
      include: baseInclude,
      order: [["createdAt", "DESC"]],
    });

    // front-end handles either array or {messages}, but keep it simple
    return res.json(messages);
  } catch (err) {
    console.error("Error loading inbox:", err);
    return res
      .status(500)
      .json({ message: "Failed to load inbox messages." });
  }
});

// ---------------------------------------------------------------------
// GET /messages/sent – all messages sent by current user
// ---------------------------------------------------------------------
router.get("/sent", authenticateToken, async (req, res) => {
  try {
    if (!Message) {
      return res.status(500).json({ message: "Message model not available." });
    }

    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const messages = await Message.findAll({
      where: { senderId: userId },
      include: baseInclude,
      order: [["createdAt", "DESC"]],
    });

    return res.json(messages);
  } catch (err) {
    console.error("Error loading sent messages:", err);
    return res
      .status(500)
      .json({ message: "Failed to load sent messages." });
  }
});

// ---------------------------------------------------------------------
// GET /messages/:id/thread – ONE conversation (per ad)
// ---------------------------------------------------------------------
router.get("/:id/thread", authenticateToken, async (req, res) => {
  try {
    if (!Message) {
      return res.status(500).json({ message: "Message model not available." });
    }

    const { id } = req.params;
    const userId = req.user && req.user.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const root = await Message.findByPk(id, { include: baseInclude });

    if (!root) {
      return res.status(404).json({ message: "Message not found." });
    }

    if (root.senderId !== userId && root.receiverId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not part of this conversation." });
    }

    const otherUserId =
      root.senderId === userId ? root.receiverId : root.senderId;

    const serviceId = root.serviceId || null;

    const where = {
      [Op.or]: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    };

    if (serviceId !== null) {
      where.serviceId = serviceId;
    }

    const messages = await Message.findAll({
      where,
      include: baseInclude,
      order: [["createdAt", "ASC"]],
    });

    return res.json({ root, messages });
  } catch (err) {
    console.error("Error loading message thread:", err);
    return res
      .status(500)
      .json({ message: "Failed to load conversation thread." });
  }
});

module.exports = router;
