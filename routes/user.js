const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const router = express.Router();

// -------- REGISTER --------
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    res.json({ message: '✅ User registered successfully', user: { id: user.id, username, email } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------- LOGIN --------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(400).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      'supersecretkey',
      { expiresIn: '1h' }
    );

    res.json({ message: '✅ Login successful', token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
