const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const User = require('../models/User');

// Create a new service
router.post('/', async (req, res) => {
    try {
        const { title, description, price, userId } = req.body;

        const service = await Service.create({
            title,
            description,
            price,
            userId
        });

        res.status(201).json({ message: 'Service created', service });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all services
router.get('/', async (req, res) => {
    try {
        const services = await Service.findAll({ include: User });
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single service by ID
router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id, { include: User });
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a service
router.delete('/:id', async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).json({ error: 'Service not found' });

        await service.destroy();
        res.json({ message: 'Service deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
