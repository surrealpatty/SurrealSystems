// src/routes/service.js
const express = require('express');
const router = express.Router();

const models = require('../models');
const { Service, User, Rating, sequelize } = models;
const { QueryTypes } = require('sequelize');

const authenticateToken = require('../middlewares/authenticateToken');
const { query, param, body } = require('express-validator');
const validate = require('../middlewares/validate');

// ----------------- Helpers -----------------
function ok(res, payload, status = 200) {
  // payload is usually { service } or { services }
  return res.status(status).json({
    success: true,
    ...payload,
    data: payload,
  });
}

function err(res, message = 'Something went wrong', status = 500, details) {
  const out = { success: false, error: { message } };
  if (details) out.error.details = details;
  return res.status(status).json(out);
}

/* ------------------------------ LIST ------------------------------- */
/**
 * GET /api/services
 * Optional query params:
 * - limit, offset
 * - userId: if present, only services for that user
 */
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('userId').optional().isInt({ min: 1 }).toInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit || 50;
      const offset = req.query.offset || 0;
      const { userId } = req.query;

      const where = {};
      if (userId) {
        where.userId = userId;
      }

      const services = await Service.findAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id', 'username'],
          },
        ],
      });

      return ok(res, { services });
    } catch (error) {
      console.error('GET /api/services failed:', error);
      return err(res, 'Failed to fetch services');
    }
  }
);

/* ----------------------------- CREATE ------------------------------ */
/**
 * POST /api/services
 * Body:
 * - title (string, required)
 * - description (string, optional)
 * - price (number, required)
 *
 * Requires logged in user (authenticateToken)
 */
router.post(
  '/',
  authenticateToken,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 255 })
      .withMessage('Title too long'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
    body('price')
      .notEmpty()
      .withMessage('Price is required')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, description, price } = req.body;

      if (!req.user || !req.user.id) {
        return err(res, 'User not found on request', 401);
      }

      const service = await Service.create({
        title,
        description: description || '',
        price,
        userId: req.user.id,
      });

      return ok(res, { service }, 201);
    } catch (error) {
      console.error('POST /api/services failed:', error);
      return err(res, 'Failed to create service');
    }
  }
);

/* ----------------------------- READ ONE ---------------------------- */
/**
 * GET /api/services/:id
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const service = await Service.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username'],
          },
        ],
      });

      if (!service) {
        return err(res, 'Service not found', 404);
      }

      return ok(res, { service });
    } catch (error) {
      console.error('GET /api/services/:id failed:', error);
      return err(res, 'Failed to fetch service');
    }
  }
);

/* ---------------------------- UPDATE ONE --------------------------- */
/**
 * PUT /api/services/:id
 * Owner-only update.
 */
router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('title').optional().trim().isLength({ max: 255 }).withMessage('Title too long'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  ],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const service = await Service.findByPk(id);

      if (!service) {
        return err(res, 'Service not found', 404);
      }

      if (service.userId !== req.user.id) {
        return err(res, 'Not allowed to edit this service', 403);
      }

      const { title, description, price } = req.body;

      if (title !== undefined) service.title = title;
      if (description !== undefined) service.description = description;
      if (price !== undefined) service.price = price;

      await service.save();

      return ok(res, { service });
    } catch (error) {
      console.error('PUT /api/services/:id failed:', error);
      return err(res, 'Failed to update service');
    }
  }
);

/* ---------------------------- DELETE ONE --------------------------- */
/**
 * DELETE /api/services/:id
 * Owner-only delete.
 */
router.delete(
  '/:id',
  authenticateToken,
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const service = await Service.findByPk(id);

      if (!service) {
        return err(res, 'Service not found', 404);
      }

      if (service.userId !== req.user.id) {
        return err(res, 'Not allowed to delete this service', 403);
      }

      await service.destroy();

      return ok(res, { deletedId: id });
    } catch (error) {
      console.error('DELETE /api/services/:id failed:', error);
      return err(res, 'Failed to delete service');
    }
  }
);

module.exports = router;
