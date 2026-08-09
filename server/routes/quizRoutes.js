const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/authorizeRole");
const { createQuiz, getAllQuizzes, getQuizById, updateQuiz, deleteQuiz } = require("../controllers/quizController");

router.post("/create", verifyToken, authorizeRole("admin"), createQuiz);
router.get("/", verifyToken, getAllQuizzes);
router.get("/:id", verifyToken, getQuizById);
router.put("/:id", verifyToken, authorizeRole("admin"), updateQuiz);
router.delete("/:id", verifyToken, authorizeRole("admin"), deleteQuiz);

module.exports = router;