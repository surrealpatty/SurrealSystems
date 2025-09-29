const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, upgradeToPaid } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authenticateToken');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require login)
router.get('/:id?', authenticateToken, getProfile);  // get profile by id or self
router.put('/update', authenticateToken, updateProfile);
router.put('/upgrade', authenticateToken, upgradeToPaid);

module.exports = router;
