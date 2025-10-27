// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || '';
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { message: 'Missing or invalid Authorization header' } });
    }

    const token = auth.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ success: false, error: { message: 'Empty token' } });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ success: false, error: { message: 'Server misconfigured' } });
    }

    // Verify token and extract user info (align with authenticateToken.js)
    const payload = jwt.verify(token, secret);

    // Normalize req.user for downstream handlers
    req.user = {
      id: payload.id || payload.userId || payload.sub,
      email: payload.email,
      _payload: payload
    };

    next();
  } catch (err) {
    const msg = err && err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, error: { message: msg } });
  }
}

module.exports = authMiddleware;
