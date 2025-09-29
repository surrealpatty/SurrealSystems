const express = require('express');
const router = express.Router();
const { Service } = require('../models/Service');
const { User } = require('../models/User');
const authenticateToken = require('../middlewares/authenticateToken');

// ---------- GET all services ----------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ services });
  } catch (err) {
    console.error('❌ Get services error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ---------- CREATE a new service ----------
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, featured, hidden } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    const service = await Service.create({
      title,
      description,
      price,
      featured: featured || false,
      hidden: hidden || false,
      userId: req.user.id
    });

    res.status(201).json({ service });
  } catch (err) {
    console.error('❌ Create service error:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// ---------- UPDATE service (owner only) ----------
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });

    const { title, description, price, featured, hidden } = req.body;
    if (title !== undefined) service.title = title;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (featured !== undefined) service.featured = featured;
    if (hidden !== undefined) service.hidden = hidden;

    await service.save();
    res.json({ service });
  } catch (err) {
    console.error('❌ Update service error:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// ---------- DELETE service (owner only) ----------
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });

    await service.destroy();
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('❌ Delete service error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ---------- TOGGLE featured (owner only) ----------
router.patch('/:id/featured', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });

    service.featured = !service.featured;
    await service.save();
    res.json({ service });
  } catch (err) {
    console.error('❌ Toggle featured error:', err);
    res.status(500).json({ error: 'Failed to toggle featured' });
  }
});

// ---------- TOGGLE hidden (owner only) ----------
router.patch('/:id/hidden', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.userId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });

    service.hidden = !service.hidden;
    await service.save();
    res.json({ service });
  } catch (err) {
    console.error('❌ Toggle hidden error:', err);
    res.status(500).json({ error: 'Failed to toggle hidden' });
  }
});

module.exports = router;
