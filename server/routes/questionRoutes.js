const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const authorizeRole = require("../middleware/authorizeRole");
console.log("Question Routes Loaded");
const { addQuestion, getQuestionsByQuiz, getQuestionById, updateQuestion, deleteQuestion } = require("../controllers/questionController");

router.post("/add", verifyToken, authorizeRole("admin"), addQuestion);
router.get("/quiz/:quiz_id", verifyToken, getQuestionsByQuiz);
router.get("/:id", verifyToken, getQuestionById);
router.put("/:id", verifyToken, authorizeRole("admin"), updateQuestion);
router.delete("/:id", verifyToken, authorizeRole("admin"), deleteQuestion);
module.exports = router;