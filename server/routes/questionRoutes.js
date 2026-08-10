const express = require('express');
const router = express.Router();
const { createQuestion, getQuestions, updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

// Mount under /api/questions for PUT/DELETE
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);

module.exports = router;