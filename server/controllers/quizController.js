const { Quiz, Question } = require('../models');
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
};