const express = require('express');
const router = express.Router();
const { getMyPerformance, getLeaderboard, getOverview } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Mount under /api/analytics and /api/leaderboard in server.js
// But usually, leaderboard might be under analytics, or top-level. 
// I will mount these specifically based on the plan.
router.get('/my-performance', protect, getMyPerformance);
router.get('/overview', protect, adminOnly, getOverview); // Keep existing overview protected

module.exports = router;