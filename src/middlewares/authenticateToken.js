// src/middlewares/authenticateToken.js
const jwt = require('jsonwebtoken');
const { getJwtSecrets } = require('../lib/jwtSecrets');

module.exports = function authenticateToken(req, res, next) {
  try {
    // Accept token from Authorization header or from cookie 'codecrowds_token'
    let token = null;
    const auth = req.headers.authorization || req.headers.Authorization || '';

    if (auth && auth.startsWith('Bearer ')) {
      token = auth.slice('Bearer '.length).trim();
    } else if (req.cookies && req.cookies.codecrowds_token) {
      token = req.cookies.codecrowds_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'Missing or invalid token' },
      });
    }

    const secrets = getJwtSecrets();
    if (!secrets.length) {
      console.error('No JWT secrets configured');
      return res.status(500).json({ success: false, error: { message: 'Server misconfigured' } });
    }

    let payload = null;
    for (const secret of secrets) {
      try {
        payload = jwt.verify(token, secret);
        break;
      } catch (e) {
        if (e && e.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, error: { message: 'Token expired' } });
        }
      }
    }

    if (!payload) {
      return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
    }

    const userId = payload.id || payload.userId || payload.sub;
    if (!userId) {
      console.error('authenticateToken: token has no user id payload', payload);
      return res.status(401).json({ success: false, error: { message: 'Invalid token payload' } });
    }

    req.user = {
      id: userId,
      email: payload.email,
      _payload: payload,
    };

    next();
  } catch (err) {
    const msg = err && err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ success: false, error: { message: msg } });
  }
};
