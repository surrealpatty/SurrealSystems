// src/routes/messages.js
const express = require('express');
const router = express.Router();
const { Message, User } = require('../models');
const authenticateToken = require('../middlewares/authenticateToken');
const { body, query, param } = require('express-validator');
const validate = require('../middlewares/validate');

/**
 * Utility helpers
 */
function ok(res, payload = {}, status = 200) {
  // Success responses always look like { success: true, ...payload }
  return res.status(status).json({ success: true, ...payload });
}

function err(res, message = 'Something went wrong', status = 500, details) {
  const out = { success: false, error: { message } };
  if (details) out.error.details = details;
  return res.status(status).json(out);
}

/**
 * GET /api/messages/inbox
 * List messages where the logged-in user is the receiver.
 */
router.get(
  '/inbox',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ?? 20;
      const offset = req.query.offset ?? 0;

      const { rows, count } = await Message.findAndCountAll({
        where: { receiverId: req.user.id },
        include: [
          {
            model: User,
            // do NOT use aliases to avoid mismatch issues
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      return ok(res, {
        messages: rows,
        count,
        limit,
        offset,
      });
    } catch (e) {
      console.error('GET /api/messages/inbox error:', e);
      return err(res, 'Failed to load inbox');
    }
  }
);

/**
 * GET /api/messages/sent
 * List messages where the logged-in user is the sender.
 */
router.get(
  '/sent',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ?? 20;
      const offset = req.query.offset ?? 0;

      const { rows, count } = await Message.findAndCountAll({
        where: { senderId: req.user.id },
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      return ok(res, {
        messages: rows,
        count,
        limit,
        offset,
      });
    } catch (e) {
      console.error('GET /api/messages/sent error:', e);
      return err(res, 'Failed to load sent messages');
    }
  }
);

/**
 * GET /api/messages/:id
 * Fetch a single message (only if the user is sender or receiver).
 */
router.get(
  '/:id',
  authenticateToken,
  [param('id').isInt().toInt()],
  validate,
  async (req, res) => {
    try {
      const id = req.params.id;

      const message = await Message.findOne({
        where: { id },
        include: [
          { model: User, attributes: ['id', 'username', 'email'] },
        ],
      });

      if (!message) {
        return err(res, 'Message not found', 404);
      }

      // (Optional) access control: make sure this user is part of the message
      if (
        message.senderId !== req.user.id &&
        message.receiverId !== req.user.id
      ) {
        return err(res, 'Not allowed to view this message', 403);
      }

      return ok(res, { message });
    } catch (e) {
      console.error('GET /api/messages/:id error:', e);
      return err(res, 'Failed to load message');
    }
  }
);

/**
 * POST /api/messages
 * Send a message.
 * Body: { receiverId, subject, body }
 */
router.post(
  '/',
  authenticateToken,
  [
    body('receiverId')
      .isInt({ min: 1 })
      .withMessage('receiverId is required'),
    body('subject')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Subject is required'),
    body('body')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Message body is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { receiverId, subject, body: content } = req.body;

      if (receiverId === req.user.id) {
        return err(res, 'You cannot send a message to yourself', 400);
      }

      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return err(res, 'Receiver not found', 404);
      }

      const message = await Message.create({
        senderId: req.user.id,
        receiverId,
        subject,
        body: content,
      });

      return ok(res, { message }, 201);
    } catch (e) {
      console.error('POST /api/messages error:', e);
      return err(res, 'Failed to send message');
    }
  }
);

module.exports = router;
