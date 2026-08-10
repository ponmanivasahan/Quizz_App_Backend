const express = require('express');
const router = express.Router();
const { startAttempt, submitAttempt, getMyAttempts, getAttemptById, reviewAttempt } = require('../controllers/attemptController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start/:quizId', protect, startAttempt);
router.post('/:attemptId/submit', protect, submitAttempt);
router.get('/my', protect, getMyAttempts);
router.get('/:attemptId', protect, getAttemptById);
router.get('/:attemptId/review', protect, reviewAttempt);

module.exports = router;