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
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        
        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        const queryOptions = { where: { quizId } };
        
        let isPaginated = false;
        if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
            isPaginated = true;
            queryOptions.limit = limit;
            queryOptions.offset = (page - 1) * limit;
        }

        const { count, rows } = await Question.findAndCountAll(queryOptions);
        
        let questions = rows;
        // Strip correct answers for students
        if (req.user && req.user.role !== 'admin') {
            questions = questions.map(q => {
                const { correctAnswer, ...safeQuestion } = q.toJSON();
                return safeQuestion;
            });
        }
        
        if (isPaginated) {
            res.json({
                success: true,
                data: questions,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } else {
            res.json({ success: true, data: questions });
        }
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