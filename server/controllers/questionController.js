const { Question, Quiz } = require('../models');

exports.createQuestion = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        
        const question = await Question.create({
            ...req.body,
            quizId: quiz.id // Enforce URL parameter quizId
        });
        res.status(201).json({ success: true, message: 'Question created successfully', data: question });
    } catch (error) { next(error); }
};

exports.getQuestions = async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        let questions = await Question.findAll({ where: { quizId } });
        
        // Strip correct answers for students
        if (req.user && req.user.role !== 'admin') {
            questions = questions.map(q => {
                const { correctAnswer, ...safeQuestion } = q.toJSON();
                return safeQuestion;
            });
        }
        
        res.json({ success: true, data: questions });
    } catch (error) { next(error); }
};

exports.updateQuestion = async (req, res, next) => {
    try {
        const question = await Question.findByPk(req.params.id);
        if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
        
        await question.update(req.body);
        res.json({ success: true, message: 'Question updated successfully', data: question });
    } catch (error) { next(error); }
};

exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findByPk(req.params.id);
        if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
        
        await question.destroy();
        res.json({ success: true, message: 'Question deleted successfully' });
    } catch (error) { next(error); }
};