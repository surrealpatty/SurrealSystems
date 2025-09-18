const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const User = require('../models/User');
const authenticateToken = require('../middlewares/authenticateToken');

// GET all services with user info
router.get('/', async (req, res) => {
    try {
        const services = await Service.findAll({
            include: { model: User, attributes: ['id', 'username'] }
        });
        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load services' });
    }
});

// POST a new service (requires token)
router.post('/', authenticateToken, async (req, res) => {
    const { title, description, price } = req.body;
    const userId = req.user.id; // ✅ use JWT user

    if (!title || !description || !price) {
        return res.status(400).json({ error: 'All fields required' });
    }

    try {
        const service = await Service.create({ title, description, price, userId });
        const createdService = await Service.findByPk(service.id, {
            include: { model: User, attributes: ['id', 'username'] }
        });
        res.status(201).json({ message: 'Service added successfully', service: createdService });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add service' });
    }
});

// PUT /services/:id
router.put('/:id', authenticateToken, async (req, res) => {
    const { title, description, price } = req.body;
    const serviceId = req.params.id;
    const userId = req.user.id;

    try {
        const service = await Service.findByPk(serviceId);
        if (!service) return res.status(404).json({ error: 'Service not found' });
        if (service.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

        service.title = title || service.title;
        service.description = description || service.description;
        service.price = price !== undefined ? price : service.price;
        await service.save();

        const updatedService = await Service.findByPk(service.id, {
            include: { model: User, attributes: ['id', 'username'] }
        });
        res.json({ message: 'Service updated', service: updatedService });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// DELETE /services/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    const serviceId = req.params.id;
    const userId = req.user.id;

    try {
        const service = await Service.findByPk(serviceId);
        if (!service) return res.status(404).json({ error: 'Service not found' });
        if (service.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

        await service.destroy();
        res.json({ message: 'Service deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

module.exports = router;
