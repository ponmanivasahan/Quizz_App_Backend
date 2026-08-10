const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzes, getQuiz, updateQuiz, deleteQuiz } = require('../controllers/quizController');
const { createQuestion, getQuestions } = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/', protect, adminOnly, createQuiz);
router.get('/', protect, getQuizzes);

// Nested routes for questions MUST come before /:id to prevent matching issues
router.post('/:quizId/questions', protect, adminOnly, createQuestion);
router.get('/:quizId/questions', protect, getQuestions);

router.get('/:id', protect, getQuiz);
router.put('/:id', protect, adminOnly, updateQuiz);
router.delete('/:id', protect, adminOnly, deleteQuiz);

module.exports = router;