const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Op, fn, col } = require('sequelize');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    // Case-insensitive email check
    const existingEmail = await User.findOne({
      where: fn('lower', col('email')), // convert column to lowercase
      [Op.eq]: email.toLowerCase()      // compare with lowercase input
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Case-insensitive username check
    const existingUsername = await User.findOne({
      where: fn('lower', col('username')),
      [Op.eq]: username.toLowerCase()
    });

    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash password and create user
    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hash });

    // Return user info
    res.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        description: newUser.description || ''
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email & password required' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        description: user.description || ''
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
