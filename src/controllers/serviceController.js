const { Service, User } = require('../models');

// GET services for a specific user
const getAllServices = async (req, res) => {
  try {
    const userId = req.query.userId; // pass userId as query param
    const services = await Service.findAll({
      where: userId ? { userId } : {},
      include: [{ model: User, attributes: ['id', 'username'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// CREATE a service
const createService = async (req, res) => {
  try {
    const { title, description, price } = req.body;
    if (!title || price === undefined)
      return res.status(400).json({ error: 'Title and price required' });

    const service = await Service.create({ title, description, price, userId: req.user.id });
    res.status(201).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create service' });
  }
};

module.exports = { getAllServices, createService };
