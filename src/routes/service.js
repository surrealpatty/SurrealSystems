// src/routes/service.js
const express = require('express');
const router = express.Router();
const { Service } = require('../models');
const authenticateToken = require('../middlewares/authenticateToken');
const { query, param, body } = require('express-validator');
const validate = require('../middlewares/validate');

/**
 * Utility: common list fetcher
 */
async function listByUserId(userId, limit, offset) {
  return Service.findAll({
    where: { userId },
    attributes: ['id', 'userId', 'title', 'price', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
}

function ok(res, payload, status = 200) {
  return res.status(status).json({ success: true, ...payload, data: payload });
}

function err(res, message = 'Something went wrong', status = 500, details) {
  const out = { success: false, error: { message } };
  if (details) out.error.details = details;
  return res.status(status).json(out);
}

/**
 * GET /api/services
 * Optional filters:
 *   - ?userId=123   -> services for a specific user
 * Pagination:
 *   - ?limit=20&offset=0
 */
router.get(
  '/',
  [
    query('userId').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ?? 20;
      const offset = req.query.offset ?? 0;

      if (req.query.userId) {
        const rows = await listByUserId(req.query.userId, limit, offset);
        res.set('Cache-Control', 'private, max-age=15');
        return ok(res, { services: rows, nextOffset: offset + rows.length });
      }

      // Fallback: list recent services (no user filter)
      const rows = await Service.findAll({
        attributes: ['id', 'userId', 'title', 'price', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      res.set('Cache-Control', 'private, max-age=15');
      return ok(res, { services: rows, nextOffset: offset + rows.length });
    } catch (e) {
      console.error('GET /services error:', e);
      return err(res, 'Failed to fetch services', 500);
    }
  }
);

/**
 * GET /api/services/user/:id
 * Alias for "services by user"
 */
router.get(
  '/user/:id',
  [param('id').isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 50 }).toInt(), query('offset').optional().isInt({ min: 0 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const limit = req.query.limit ?? 20;
      const offset = req.query.offset ?? 0;
      const rows = await listByUserId(userId, limit, offset);
      res.set('Cache-Control', 'private, max-age=15');
      return ok(res, { services: rows, nextOffset: offset + rows.length });
    } catch (e) {
      console.error('GET /services/user/:id error:', e);
      return err(res, 'Failed to fetch user services', 500);
    }
  }
);

/**
 * GET /api/users/:id/services
 * Another common alias some frontends call
 */
router.get(
  '/users/:id/services', // this router is mounted at /api, so path is /api/users/:id/services
  [param('id').isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 50 }).toInt(), query('offset').optional().isInt({ min: 0 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const limit = req.query.limit ?? 20;
      const offset = req.query.offset ?? 0;
      const rows = await listByUserId(userId, limit, offset);
      res.set('Cache-Control', 'private, max-age=15');
      return ok(res, { services: rows, nextOffset: offset + rows.length });
    } catch (e) {
      console.error('GET /users/:id/services error:', e);
      return err(res, 'Failed to fetch user services', 500);
    }
  }
);

/**
 * GET /api/users/me/services
 * Current user's services (profile page often calls this)
 */
router.get(
  '/users/me/services',
  [query('limit').optional().isInt({ min: 1, max: 50 }).toInt(), query('offset').optional().isInt({ min: 0 }).toInt()],
  validate,
  authenticateToken,
  async (req, res) => {
    try {
      const limit = req.query.limit ?? 20;
      const offset = req.query.offset ?? 0;
      const rows = await listByUserId(req.user.id, limit, offset);
      res.set('Cache-Control', 'private, max-age=15');
      return ok(res, { services: rows, nextOffset: offset + rows.length });
    } catch (e) {
      console.error('GET /users/me/services error:', e);
      return err(res, 'Failed to fetch my services', 500);
    }
  }
);

/**
 * (Optional) GET /api/services/:id
 * Single service fetch (handy for detail views)
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const s = await Service.findByPk(req.params.id, {
        attributes: ['id', 'userId', 'title', 'price', 'createdAt', 'updatedAt']
      });
      if (!s) return err(res, 'Service not found', 404);
      return ok(res, { service: s });
    } catch (e) {
      console.error('GET /services/:id error:', e);
      return err(res, 'Failed to fetch service', 500);
    }
  }
);

module.exports = router;
