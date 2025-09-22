const express = require('express');
const router = express.Router();
const { User } = require('../models'); // adjust the path if your User model is elsewhere
const authenticateToken = require('../middlewares/authenticateToken');

// =========================
// GET a user's profile by ID
// =========================
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'username', 'email', 'description'] // only return safe fields
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// =========================
// UPDATE a user's profile by ID
// =========================
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { username, description } = req.body;

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.username = username || user.username;
        user.description = description || user.description;
        await user.save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
