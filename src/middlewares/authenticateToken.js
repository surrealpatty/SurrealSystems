const jwt = require('jsonwebtoken');
const { User } = require('../models'); // ✅ Import User from index.js
require('dotenv').config();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token)
    return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'tier']
    });

    if (!user)
      return res.status(401).json({ error: 'Invalid token user.' });

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      tier: user.tier
    };

    next();
  } catch (err) {
    console.error('JWT error:', err);
    res.status(403).json({ error: 'Invalid token.' });
  }
};

module.exports = authenticateToken;
