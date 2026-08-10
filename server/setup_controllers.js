const fs = require('fs');
const path = require('path');

const userController = `const { User } = require('../models');
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json({ success: true, data: users });
    } catch (error) { next(error); }
};
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) { next(error); }
};
exports.updateUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (req.user.role !== 'admin' && req.user.id !== user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
        
        const { name, email, password } = req.body;
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) {
            const bcrypt = require('bcryptjs');
            user.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
        }
        await user.save();
        res.json({ success: true, message: 'User updated', data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) { next(error); }
};
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await user.destroy();
        res.json({ success: true, message: 'User deleted' });
    } catch (error) { next(error); }
};`;

const quizController = `const { Quiz, Question } = require('../models');
exports.createQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.create({ ...req.body, createdBy: req.user.id });
        res.status(201).json({ success: true, message: 'Quiz created successfully', data: quiz });
    } catch (error) { next(error); }
};
exports.getQuizzes = async (req, res, next) => {
    try {
        const quizzes = await Quiz.findAll();
        res.json({ success: true, data: quizzes });
    } catch (error) { next(error); }
};
exports.getQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findByPk(req.params.id, { include: ['questions'] });
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        res.json({ success: true, data: quiz });
    } catch (error) { next(error); }
};
exports.updateQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findByPk(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        await quiz.update(req.body);
        res.json({ success: true, message: 'Quiz updated', data: quiz });
    } catch (error) { next(error); }
};
exports.deleteQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findByPk(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        await quiz.destroy();
        res.json({ success: true, message: 'Quiz deleted' });
    } catch (error) { next(error); }
};`;

const attemptController = `const { Attempt, AttemptAnswer, Quiz, Question } = require('../models');

exports.startAttempt = async (req, res, next) => {
    try {
        const quiz = await Quiz.findByPk(req.params.quizId, { include: ['questions'] });
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        
        const attempt = await Attempt.create({
            userId: req.user.id,
            quizId: quiz.id,
            totalMarks: quiz.totalMarks,
            startedAt: new Date()
        });
        
        const questions = quiz.questions.map(q => ({
            id: q.id, questionText: q.questionText, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, marks: q.marks
        }));
        
        res.status(201).json({ success: true, data: { attemptId: attempt.id, questions } });
    } catch (error) { next(error); }
};

exports.submitAttempt = async (req, res, next) => {
    try {
        const attempt = await Attempt.findByPk(req.params.attemptId);
        if (!attempt || attempt.userId !== req.user.id) return res.status(404).json({ success: false, message: 'Attempt not found' });
        if (attempt.status === 'Completed') return res.status(400).json({ success: false, message: 'Already submitted' });
        
        const quiz = await Quiz.findByPk(attempt.quizId, { include: ['questions'] });
        
        // Timer validation
        const elapsedMinutes = (new Date() - new Date(attempt.startedAt)) / 60000;
        if (elapsedMinutes > quiz.duration + 2) { // 2 min grace period
            // Optional: force submission or fail
        }
        
        const { answers } = req.body; // array of { questionId, selectedAnswer }
        let score = 0;
        
        for (let ans of answers) {
            const question = quiz.questions.find(q => q.id === ans.questionId);
            if (question) {
                const isCorrect = question.correctAnswer === ans.selectedAnswer;
                const marksObtained = isCorrect ? question.marks : 0;
                score += marksObtained;
                
                await AttemptAnswer.create({
                    attemptId: attempt.id,
                    questionId: question.id,
                    selectedAnswer: ans.selectedAnswer,
                    correctAnswer: question.correctAnswer,
                    marksObtained,
                    isCorrect
                });
            }
        }
        
        attempt.score = score;
        attempt.percentage = Math.round((score / attempt.totalMarks) * 100);
        attempt.status = 'Completed';
        attempt.submittedAt = new Date();
        await attempt.save();
        
        res.json({ success: true, message: 'Attempt submitted', data: attempt });
    } catch (error) { next(error); }
};

exports.getMyAttempts = async (req, res, next) => {
    try {
        const attempts = await Attempt.findAll({ where: { userId: req.user.id } });
        res.json({ success: true, data: attempts });
    } catch (error) { next(error); }
};`;

fs.writeFileSync(path.join(__dirname, 'controllers', 'userController.js'), userController);
fs.writeFileSync(path.join(__dirname, 'controllers', 'quizController.js'), quizController);
fs.writeFileSync(path.join(__dirname, 'controllers', 'attemptController.js'), attemptController);

console.log("Controllers created.");
