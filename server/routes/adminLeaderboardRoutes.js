const express = require('express');
const router = express.Router();
const { getAdminLeaderboard, getAdminSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.get('/', protect, adminOnly, getAdminLeaderboard);
router.get('/summary', protect, adminOnly, getAdminSummary);

module.exports = router;
