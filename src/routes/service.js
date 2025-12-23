// src/routes/service.js
const express = require('express');
const router = express.Router();
const models = require('../models');
/* eslint-disable-next-line no-unused-vars */
const { Service, User, Rating, sequelize } = models;
const { QueryTypes } = require('sequelize');
const authenticateToken = require('../middlewares/authenticateToken');
const { query, param, body } = require('express-validator');
const validate = require('../middlewares/validate');

function ok(res, payload, status = 200) {
  return res.status(status).json({ success: true, ...payload, data: payload });
}
function err(res, message = 'Something went wrong', status = 500, details) {
  const out = { success: false, error: { message } };
  if (details) out.error.details = details;
  return res.status(status).json(out);
}

// Equity validation helper (0.5 to 99.5, step 0.5)
function normalizeEquity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  // force to 0.5 steps
  const stepped = Math.round(n * 2) / 2;

  if (stepped < 0.5 || stepped > 99.5) return null;
  return stepped;
}

/* ------------------------------ LIST ------------------------------- */
router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('userId').optional().isInt({ min: 1 }).toInt(),
  ],
  validate,
  async (req, res) => {
    try {
      const limit = req.query.limit ?? 20;
      const page = req.query.page;
      const offset =
        typeof page === 'number' ? (Math.max(1, page) - 1) * limit : (req.query.offset ?? 0);

      const where = {};
      if (req.query.userId) where.userId = Number(req.query.userId);

      // fetch services with owner
      const rows = await Service.findAll({
        where: Object.keys(where).length ? where : undefined,
        attributes: [
          'id',
          'userId',
          'title',
          'description',
          'needs',
          'equityPercentage',
          'createdAt',
          'updatedAt',
        ],
        include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      if (!rows || !rows.length)
        return ok(res, { services: [], hasMore: false, nextOffset: offset });

      const serviceIds = rows.map((r) => r.id);
      console.info('[services] fetched rows count=%d, serviceIds=%o', rows.length, serviceIds.slice(0, 5));

      const summaryMap = {};

      try {
        // NOTE: ratings table columns use camelCase ("serviceId"). Alias to "serviceId"
        const rowsRaw = await sequelize.query(
          `SELECT "serviceId",
                  AVG(COALESCE(stars, score))::numeric(10,2) AS "avgRating",
                  COUNT(*)::int AS "ratingsCount"
           FROM ratings
           WHERE "serviceId" IS NOT NULL AND "serviceId" IN (:ids)
           GROUP BY "serviceId"`,
          { replacements: { ids: serviceIds }, type: QueryTypes.SELECT },
        );

        console.info('[services] aggregation rowsRaw sample:', (rowsRaw || []).slice(0, 5));

        (rowsRaw || []).forEach((r) => {
          summaryMap[r.serviceId] = {
            avgRating:
              r.avgRating !== null && r.avgRating !== undefined
                ? Number(Number(r.avgRating).toFixed(2))
                : null,
            ratingsCount: Number(r.ratingsCount || 0),
          };
        });
      } catch (e) {
        console.info(
          'Ratings aggregation skipped or failed (no service-level ratings or DB schema mismatch):',
          e && e.message ? e.message : e,
        );
      }

      const services = rows.map((s) => {
        const sum = summaryMap[s.id] || { avgRating: null, ratingsCount: 0 };
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          needs: s.needs,
          equityPercentage: s.equityPercentage,
          owner: s.owner || null,
          user: s.owner || null,
          userId: s.userId,
          avgRating: sum.avgRating,
          ratingsCount: sum.ratingsCount,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      });

      const hasMore = rows.length >= limit;
      return ok(res, { services, hasMore, nextOffset: offset + rows.length });
    } catch (e) {
      console.error('GET /api/services error:', e && e.stack ? e.stack : e);
      return err(res, 'Failed to load services', 500);
    }
  },
);

/* ------------------------------ CREATE ------------------------------ */
router.post(
  '/',
  authenticateToken,
  [
    body('title').isString().isLength({ min: 3 }).withMessage('Title is required (min 3 chars)'),
    body('description')
      .isString()
      .isLength({ min: 3, max: 2000 })
      .withMessage('Description is required (min 3 chars, max 2000)'),
    body('needs')
      .isString()
      .isLength({ min: 3, max: 2000 })
      .withMessage('Needs is required (min 3 chars, max 2000)'),
    body('equityPercentage')
      .exists()
      .withMessage('equityPercentage is required')
      .custom((value) => normalizeEquity(value) !== null)
      .withMessage('Equity must be between 0.5 and 99.5 (steps of 0.5)'),
  ],
  validate,
  async (req, res) => {
    try {
      const userId = Number(req.user.id);

      const title = String(req.body.title).trim();
      const description = String(req.body.description).trim();
      const needs = String(req.body.needs).trim();
      const equity = normalizeEquity(req.body.equityPercentage);

      // normalizeEquity already validated by middleware, but keep a safe guard
      if (equity === null) {
        return err(res, 'Equity must be between 0.5 and 99.5 (steps of 0.5)', 400);
      }

      const svc = await Service.create({
        userId,
        title,
        description,
        needs,
        equityPercentage: equity,
      });

      return ok(res, { service: svc }, 201);
    } catch (e) {
      console.error('Create service error:', e && e.stack ? e.stack : e);
      return err(res, 'Failed to create service', 500);
    }
  },
);

/* ----------------------------- GET by ID ---------------------------- */
router.get('/:id', [param('id').isInt({ min: 1 }).toInt()], validate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const svc = await Service.findByPk(id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'username'] }],
    });
    if (!svc) return err(res, 'Service not found', 404);
    return ok(res, { service: svc });
  } catch (e) {
    console.error('Get service error:', e && e.stack ? e.stack : e);
    return err(res, 'Failed to load service', 500);
  }
});

/* ------------------------------ UPDATE ------------------------------ */
router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isInt({ min: 1 }).toInt(),

    body('title').optional().isString().isLength({ min: 3 }).withMessage('Title must be at least 3 chars'),

    body('description')
      .optional()
      .isString()
      .isLength({ min: 3, max: 2000 })
      .withMessage('Description must be 3-2000 chars'),

    body('needs')
      .optional()
      .isString()
      .isLength({ min: 3, max: 2000 })
      .withMessage('Needs must be 3-2000 chars'),

    body('equityPercentage')
      .optional()
      .custom((value) => normalizeEquity(value) !== null)
      .withMessage('Equity must be between 0.5 and 99.5 (steps of 0.5)'),
  ],
  validate,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const svc = await Service.findByPk(id);
      if (!svc) return err(res, 'Service not found', 404);
      if (Number(svc.userId) !== Number(req.user.id)) return err(res, 'Forbidden', 403);

      const updates = {};

      if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
      if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
      if (req.body.needs !== undefined) updates.needs = String(req.body.needs).trim();

      if (req.body.equityPercentage !== undefined) {
        const equity = normalizeEquity(req.body.equityPercentage);
        if (equity === null) return err(res, 'Equity must be between 0.5 and 99.5 (steps of 0.5)', 400);
        updates.equityPercentage = equity;
      }

      await svc.update(updates);
      return ok(res, { service: svc });
    } catch (e) {
      console.error('Update service error:', e && e.stack ? e.stack : e);
      return err(res, 'Failed to update service', 500);
    }
  },
);

/* ------------------------------ DELETE ------------------------------ */
router.delete(
  '/:id',
  authenticateToken,
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const svc = await Service.findByPk(id);
      if (!svc) return err(res, 'Service not found', 404);
      if (Number(svc.userId) !== Number(req.user.id)) return err(res, 'Forbidden', 403);

      await svc.destroy();
      return ok(res, { message: 'Service deleted' });
    } catch (e) {
      console.error('Delete service error:', e && e.stack ? e.stack : e);
      return err(res, 'Failed to delete service', 500);
    }
  },
);

module.exports = router;
