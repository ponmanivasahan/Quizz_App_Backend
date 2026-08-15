const { Attempt, User, Quiz, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getOverview = async (req, res, next) => {
    res.json({ success: true, data: { message: 'Analytics overview (mocked)' } });
};

exports.getMyPerformance = async (req, res, next) => {
    try {
        const attempts = await Attempt.findAll({
            where: { userId: req.user.id, status: 'Completed' },
            order: [['submittedAt', 'DESC']]
        });
        
        let totalScore = 0;
        let totalPercentage = 0;
        let highestScore = 0;
        
        attempts.forEach(a => {
            totalScore += a.score;
            totalPercentage += a.percentage;
            if (a.score > highestScore) highestScore = a.score;
        });
        
        const totalAttempts = attempts.length;
        
        res.json({
            success: true,
            data: {
                totalAttempts,
                averageScore: totalAttempts ? (totalScore / totalAttempts).toFixed(2) : 0,
                averagePercentage: totalAttempts ? (totalPercentage / totalAttempts).toFixed(2) : 0,
                highestScore,
                recentAttempts: attempts.slice(0, 5) // Last 5
            }
        });
    } catch (error) { next(error); }
};

exports.getLeaderboard = async (req, res, next) => {
    try {
        const { quizId } = req.query;
        const attemptWhere = { status: 'Completed' };
        if (quizId) attemptWhere.quizId = quizId;

        const users = await User.findAll({
            where: { role: 'student' },
            include: [{
                model: Attempt,
                as: 'attempts',
                where: attemptWhere,
                required: true,
                attributes: []
            }],
            attributes: [
                'id',
                'name',
                [sequelize.fn('COUNT', sequelize.col('attempts.id')), 'totalAttempts'],
                [sequelize.fn('AVG', sequelize.col('attempts.score')), 'averageScore'],
                [sequelize.fn('AVG', sequelize.col('attempts.percentage')), 'averagePercentage'],
                [sequelize.fn('MAX', sequelize.col('attempts.score')), 'highestScore'],
                [sequelize.literal(`CAST(SUM(CASE WHEN \`attempts\`.\`percentage\` >= 50 THEN 1 ELSE 0 END) AS UNSIGNED)`), 'quizzesPassed']
            ],
            group: ['User.id'],
            order: [
                [sequelize.literal('averagePercentage'), 'DESC'],
                [sequelize.literal('highestScore'), 'DESC'],
                [sequelize.literal('totalAttempts'), 'DESC']
            ]
        });
        
        let myRank = null;
        
        const leaderboard = users.map((u, index) => {
            const rank = index + 1;
            if (req.user && u.id === req.user.id) myRank = rank;
            return {
                rank,
                studentId: u.id,
                studentName: u.name,
                totalAttempts: parseInt(u.getDataValue('totalAttempts'), 10),
                averageScore: parseFloat(u.getDataValue('averageScore') || 0).toFixed(2),
                averagePercentage: parseFloat(u.getDataValue('averagePercentage') || 0).toFixed(2),
                highestScore: u.getDataValue('highestScore'),
                quizzesPassed: parseInt(u.getDataValue('quizzesPassed') || 0, 10)
            };
        });
        
        const responseData = { data: leaderboard };
        if (myRank !== null) responseData.myRank = myRank;
        
        res.json({ success: true, ...responseData });
    } catch (error) { next(error); }
};

exports.getAdminLeaderboard = async (req, res, next) => {
    try {
        const { quizId, search, status, from, to, page = 1, limit = 20, sort = 'averagePercentage', order = 'DESC' } = req.query;
        
        const attemptWhere = { status: 'Completed' };
        if (quizId) attemptWhere.quizId = quizId;
        if (from || to) {
            attemptWhere.submittedAt = {};
            if (from) attemptWhere.submittedAt[Op.gte] = new Date(from);
            if (to) attemptWhere.submittedAt[Op.lte] = new Date(to);
        }

        const userWhere = { role: 'student' };
        if (search) {
            userWhere[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;
        
        const validSortFields = ['averagePercentage', 'highestScore', 'totalAttempts', 'latestAttempt'];
        const sortField = validSortFields.includes(sort) ? sort : 'averagePercentage';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const orderClause = [];
        if (sortField === 'latestAttempt') {
            orderClause.push([sequelize.literal('latestAttempt'), sortOrder]);
        } else {
            orderClause.push([sequelize.literal(sortField), sortOrder]);
        }

        const users = await User.findAndCountAll({
            where: userWhere,
            include: [{
                model: Attempt,
                as: 'attempts',
                where: attemptWhere,
                required: true,
                attributes: []
            }],
            attributes: [
                'id',
                'name',
                'email',
                [sequelize.fn('COUNT', sequelize.col('attempts.id')), 'totalAttempts'],
                [sequelize.fn('AVG', sequelize.col('attempts.score')), 'averageScore'],
                [sequelize.fn('AVG', sequelize.col('attempts.percentage')), 'averagePercentage'],
                [sequelize.fn('MAX', sequelize.col('attempts.score')), 'highestScore'],
                [sequelize.fn('MIN', sequelize.col('attempts.score')), 'lowestScore'],
                [sequelize.fn('MAX', sequelize.col('attempts.submittedAt')), 'latestAttempt'],
                [sequelize.literal(`CAST(SUM(CASE WHEN \`attempts\`.\`percentage\` >= 50 THEN 1 ELSE 0 END) AS UNSIGNED)`), 'quizzesPassed']
            ],
            group: ['User.id'],
            order: orderClause,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            subQuery: false
        });
        
        const total = users.count ? users.count.length : 0;
        const totalPages = Math.ceil(total / limit);

        const data = users.rows.map((u, index) => {
            return {
                rank: offset + index + 1,
                studentId: u.id,
                studentName: u.name,
                email: u.email,
                totalAttempts: parseInt(u.getDataValue('totalAttempts') || 0, 10),
                averageScore: parseFloat(u.getDataValue('averageScore') || 0).toFixed(2),
                averagePercentage: parseFloat(u.getDataValue('averagePercentage') || 0).toFixed(2),
                highestScore: u.getDataValue('highestScore'),
                lowestScore: u.getDataValue('lowestScore'),
                quizzesPassed: parseInt(u.getDataValue('quizzesPassed') || 0, 10),
                latestAttempt: u.getDataValue('latestAttempt')
            };
        });

        res.json({
            success: true,
            data,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total,
                totalPages
            }
        });
    } catch (error) { next(error); }
};

exports.getAdminSummary = async (req, res, next) => {
    try {
        const totalStudents = await User.count({ where: { role: 'student' } });
        
        const attemptStats = await Attempt.findOne({
            where: { status: 'Completed' },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalCompleted'],
                [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
                [sequelize.fn('MAX', sequelize.col('score')), 'highestScore'],
                [sequelize.literal(`CAST(SUM(CASE WHEN percentage >= 50 THEN 1 ELSE 0 END) AS UNSIGNED)`), 'passedCount']
            ]
        });

        const totalCompleted = attemptStats ? parseInt(attemptStats.getDataValue('totalCompleted') || 0, 10) : 0;
        const passedCount = attemptStats ? parseInt(attemptStats.getDataValue('passedCount') || 0, 10) : 0;
        const passRate = totalCompleted > 0 ? parseFloat((passedCount / totalCompleted) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                totalStudents,
                totalCompletedAttempts: totalCompleted,
                averageScore: attemptStats ? parseFloat(attemptStats.getDataValue('averageScore') || 0).toFixed(2) : 0,
                highestScore: attemptStats ? attemptStats.getDataValue('highestScore') || 0 : 0,
                passRate
            }
        });
    } catch (error) { next(error); }
};