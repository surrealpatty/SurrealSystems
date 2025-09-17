// src/middlewares/authenticateToken.js
const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware
 * Protects routes by verifying JWT token from Authorization header
 */
module.exports = function authenticateToken(req, res, next) {
    try {
        // Get token from "Authorization" header: "Bearer <token>"
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // Verify token
        const secretKey = process.env.JWT_SECRET || 'supersecretkey';
        const decoded = jwt.verify(token, secretKey);

        // Attach decoded user payload to req.user
        req.user = decoded;

        // Proceed to next middleware or route handler
        next();
    } catch (err) {
        console.error('JWT verification error:', err.message); // log only the message
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
