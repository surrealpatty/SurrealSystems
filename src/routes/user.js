const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, upgradeToPaid } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authenticateToken');

router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id?', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.patch('/upgrade', authenticateToken, upgradeToPaid);

module.exports = router;
