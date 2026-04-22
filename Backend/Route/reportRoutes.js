const express = require('express');
const router = express.Router();
const { generateReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, generateReport);

module.exports = router;