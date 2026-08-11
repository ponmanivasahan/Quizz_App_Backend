const { Attempt, AttemptAnswer, Quiz, Question, sequelize } = require('../models');

exports.startAttempt = async (req, res, next) => {
    try {
        const quiz = await Quiz.findByPk(req.params.quizId, { include: ['questions'] });
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
        
        // Check for existing "In Progress" attempt
        const existingAttempt = await Attempt.findOne({ where: { userId: req.user.id, quizId: quiz.id, status: 'In Progress' } });
        if (existingAttempt) return res.status(400).json({ success: false, message: 'You already have an active attempt for this quiz.' });
        
        const previousAttemptsCount = await Attempt.count({ where: { userId: req.user.id, quizId: quiz.id } });
        if (previousAttemptsCount >= 2) {
            return res.status(409).json({ success: false, message: 'You have already used both attempts for this quiz.' });
        }

        const attempt = await Attempt.create({
            userId: req.user.id,
            quizId: quiz.id,
            attemptNumber: previousAttemptsCount + 1,
            totalMarks: quiz.totalMarks, // Will be updated based on selected questions
            startedAt: new Date()
        });
        
        // Shuffle and select questions
        const shuffled = quiz.questions.sort(() => 0.5 - Math.random());
        const perAttempt = quiz.questionsPerAttempt || 10;
        const selectedQuestions = shuffled.slice(0, perAttempt);
        
        let dynamicTotalMarks = 0;
        const attemptAnswersData = selectedQuestions.map(q => {
            dynamicTotalMarks += q.marks;
            return {
                attemptId: attempt.id,
                questionId: q.id,
                selectedAnswer: null, // User hasn't answered yet
                correctAnswer: q.correctAnswer, // Hidden from user
                marksObtained: 0,
                isCorrect: false
            };
        });
        
        // Pre-create the answer records
        const { AttemptAnswer } = require('../models');
        await AttemptAnswer.bulkCreate(attemptAnswersData);
        
        // Update attempt's total marks if it differs from default quiz totalMarks
        if (dynamicTotalMarks !== attempt.totalMarks) {
            attempt.totalMarks = dynamicTotalMarks;
            await attempt.save();
        }
        
        const questions = selectedQuestions.map(q => ({
            id: q.id, questionText: q.questionText, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, marks: q.marks
        }));
        
        res.status(201).json({ success: true, data: { attemptId: attempt.id, quizId: quiz.id, attemptNumber: attempt.attemptNumber, startedAt: attempt.startedAt, duration: quiz.duration, questions } });
    } catch (error) { 
        console.error('START ATTEMPT ERROR:', error);
        next(error); 
    }
};

exports.submitAttempt = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const attempt = await Attempt.findByPk(req.params.attemptId, { transaction: t });
        if (!attempt || attempt.userId !== req.user.id) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Attempt not found' });
        }
        if (attempt.status === 'Completed' || attempt.status === 'Expired') {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'This attempt has already been submitted.' });
        }
        
        const quiz = await Quiz.findByPk(attempt.quizId, { include: ['questions'], transaction: t });
        
        // Timer Enforcement
        const now = new Date();
        const startedAt = new Date(attempt.startedAt);
        const elapsedMinutes = (now - startedAt) / 60000;
        
        // Allow 1 minute grace period for network latency
        let isExpired = false;
        if (elapsedMinutes > (quiz.duration + 1)) {
            isExpired = true;
        }

        const { answers } = req.body; // array of { questionId, selectedAnswer }
        let score = 0;
        
        const answerPromises = [];

        const existingAnswers = await AttemptAnswer.findAll({ where: { attemptId: attempt.id }, transaction: t });

        for (let ans of answers) {
            const existingAnswer = existingAnswers.find(ea => ea.questionId === ans.questionId);
            const question = quiz.questions.find(q => q.id === ans.questionId);
            
            // Only process answers for questions that were assigned to this attempt
            if (existingAnswer && question) {
                const isCorrect = existingAnswer.correctAnswer === ans.selectedAnswer;
                const marksObtained = isCorrect ? question.marks : 0;
                score += marksObtained;
                
                existingAnswer.selectedAnswer = ans.selectedAnswer;
                existingAnswer.marksObtained = marksObtained;
                existingAnswer.isCorrect = isCorrect;
                answerPromises.push(existingAnswer.save({ transaction: t }));
            }
        }
        
        await Promise.all(answerPromises);

        attempt.score = score;
        attempt.percentage = Math.round((score / attempt.totalMarks) * 100);
        attempt.status = isExpired ? 'Expired' : 'Completed';
        attempt.submittedAt = new Date();
        await attempt.save({ transaction: t });
        
        await t.commit();
        res.json({ success: true, message: isExpired ? 'Attempt expired and submitted' : 'Attempt submitted', data: attempt });
    } catch (error) { 
        await t.rollback();
        next(error); 
    }
};

exports.getMyAttempts = async (req, res, next) => {
    try {
        const attempts = await Attempt.findAll({ 
            where: { userId: req.user.id },
            include: [{ model: Quiz, as: 'quiz', attributes: ['title'] }]
        });
        const data = attempts.map(a => ({
            attemptId: a.id,
            quizId: a.quizId,
            quizTitle: a.quiz ? a.quiz.title : 'Unknown Quiz',
            attemptNumber: a.attemptNumber,
            score: a.score,
            totalMarks: a.totalMarks,
            percentage: a.percentage,
            status: a.status,
            startedAt: a.startedAt,
            submittedAt: a.submittedAt
        }));
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

exports.getAttemptById = async (req, res, next) => {
    try {
        const attempt = await Attempt.findByPk(req.params.attemptId, {
            include: [
                { model: Quiz, as: 'quiz', attributes: ['title'] },
                { model: AttemptAnswer, as: 'answers', attributes: ['isCorrect'] }
            ]
        });
        if (!attempt || attempt.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        
        let correctCount = 0;
        let incorrectCount = 0;
        
        if (attempt.answers) {
            attempt.answers.forEach(ans => {
                if (ans.isCorrect) correctCount++;
                else incorrectCount++;
            });
        }
        
        const data = {
            quizTitle: attempt.quiz ? attempt.quiz.title : 'Unknown',
            attemptNumber: attempt.attemptNumber,
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percentage: attempt.percentage,
            correctCount,
            incorrectCount,
            submittedAt: attempt.submittedAt,
            status: attempt.status
        };
        
        res.json({ success: true, data });
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