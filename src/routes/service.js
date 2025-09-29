const express = require('express');
const router = express.Router();
const { getAllServices, createService } = require('../controllers/serviceController');
const authenticateToken = require('../middlewares/authenticateToken');

router.get('/', authenticateToken, getAllServices);
router.post('/', authenticateToken, createService);

module.exports = router;
