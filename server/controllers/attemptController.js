const { Attempt, AttemptAnswer, Quiz, Question, sequelize } = require('../models');

exports.startAttempt = async (req, res, next) => {
    try {
        const quiz = await Quiz.findByPk(req.params.quizId, { include: ['questions'] });
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        
        // Check for existing "In Progress" attempt
        const existingAttempt = await Attempt.findOne({ where: { userId: req.user.id, quizId: quiz.id, status: 'In Progress' } });
        if (existingAttempt) return res.status(400).json({ success: false, message: 'You already have an active attempt for this quiz.' });
        
        const attempt = await Attempt.create({
            userId: req.user.id,
            quizId: quiz.id,
            totalMarks: quiz.totalMarks,
            startedAt: new Date()
        });
        
        const questions = quiz.questions.map(q => ({
            id: q.id, questionText: q.questionText, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, marks: q.marks
        }));
        
        res.status(201).json({ success: true, data: { attemptId: attempt.id, quizId: quiz.id, startedAt: attempt.startedAt, duration: quiz.duration, questions } });
    } catch (error) { next(error); }
};

exports.submitAttempt = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const attempt = await Attempt.findByPk(req.params.attemptId, { transaction: t });
        if (!attempt || attempt.userId !== req.user.id) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Attempt not found' });
        }
        if (attempt.status === 'Completed') {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Already submitted' });
        }
        
        const quiz = await Quiz.findByPk(attempt.quizId, { include: ['questions'], transaction: t });
        
        const { answers } = req.body; // array of { questionId, selectedAnswer }
        let score = 0;
        
        const answerPromises = [];

        for (let ans of answers) {
            const question = quiz.questions.find(q => q.id === ans.questionId);
            if (question) {
                const isCorrect = question.correctAnswer === ans.selectedAnswer;
                const marksObtained = isCorrect ? question.marks : 0;
                score += marksObtained;
                
                answerPromises.push(AttemptAnswer.create({
                    attemptId: attempt.id,
                    questionId: question.id,
                    selectedAnswer: ans.selectedAnswer,
                    correctAnswer: question.correctAnswer,
                    marksObtained,
                    isCorrect
                }, { transaction: t }));
            }
        }
        
        await Promise.all(answerPromises);

        attempt.score = score;
        attempt.percentage = Math.round((score / attempt.totalMarks) * 100);
        attempt.status = 'Completed';
        attempt.submittedAt = new Date();
        await attempt.save({ transaction: t });
        
        await t.commit();
        res.json({ success: true, message: 'Attempt submitted', data: attempt });
    } catch (error) { 
        await t.rollback();
        next(error); 
    }
};

exports.getMyAttempts = async (req, res, next) => {
    try {
        const attempts = await Attempt.findAll({ where: { userId: req.user.id } });
        res.json({ success: true, data: attempts });
    } catch (error) { next(error); }
};

exports.getAttemptById = async (req, res, next) => {
    try {
        const attempt = await Attempt.findByPk(req.params.attemptId);
        if (!attempt || attempt.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        res.json({ success: true, data: attempt });
    } catch (error) { next(error); }
};

exports.reviewAttempt = async (req, res, next) => {
    try {
        const attempt = await Attempt.findByPk(req.params.attemptId, {
            include: [{ model: AttemptAnswer, as: 'answers', include: ['question'] }]
        });
        
        if (!attempt || attempt.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        
        if (attempt.status !== 'Completed') {
            return res.status(400).json({ success: false, message: 'Attempt is not completed yet.' });
        }
        
        res.json({ success: true, data: attempt });
    } catch (error) { next(error); }
};