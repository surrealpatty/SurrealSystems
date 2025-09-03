const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { User } = require('../models/User');
const authMiddleware = require('../middlewares/authMiddleware');

// CREATE SERVICE
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, price } = req.body;
    const service = await Service.create({ title, description, price, userId: req.user.id });
    res.status(201).json({ message: '✅ Service created successfully', service });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET ALL SERVICES
router.get('/', async (req, res) => {
  try {
    const services = await Service.findAll({ include: { model: User, attributes: ['id', 'username', 'email'] } });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SERVICE BY ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, { include: { model: User, attributes: ['id', 'username', 'email'] } });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE SERVICE (only owner)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await service.destroy();
    res.json({ message: '🗑️ Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
