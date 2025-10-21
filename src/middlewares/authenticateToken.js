// middlewares/authenticateToken.js
const jwt = require('jsonwebtoken');

module.exports = function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  // Expect "Bearer <token>"
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ use env secret
    // normalized shape: { id, email? }
    req.user = { id: decoded.id, email: decoded.email };
    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
