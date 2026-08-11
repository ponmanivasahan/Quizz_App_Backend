const { Attempt, User, sequelize } = require('../models');

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
        const users = await User.findAll({
            where: { role: 'student' },
            include: [{
                model: Attempt,
                as: 'attempts', // wait, does User haveMany Attempts in models? Need to ensure association exists! 
                where: { status: 'Completed' },
                required: true, // Only users with completed attempts
                attributes: []
            }],
            attributes: [
                'id',
                'name',
                [sequelize.fn('COUNT', sequelize.col('attempts.id')), 'totalAttempts'],
                [sequelize.fn('AVG', sequelize.col('attempts.score')), 'averageScore'],
                [sequelize.fn('AVG', sequelize.col('attempts.percentage')), 'averagePercentage']
            ],
            group: ['User.id'],
            order: [[sequelize.literal('averagePercentage'), 'DESC']]
        });
        
        let myRank = null;
        
        // Add ranks
        const leaderboard = users.map((u, index) => {
            const rank = index + 1;
            if (req.user && u.id === req.user.id) myRank = rank;
            return {
                rank,
                name: u.name,
                totalAttempts: u.getDataValue('totalAttempts'),
                averageScore: u.getDataValue('averageScore') ? parseFloat(u.getDataValue('averageScore')).toFixed(2) : 0,
                averagePercentage: u.getDataValue('averagePercentage') ? parseFloat(u.getDataValue('averagePercentage')).toFixed(2) : 0
            };
        });
        
        const responseData = { leaderboard };
        if (myRank !== null) responseData.myRank = myRank;
        
        res.json({ success: true, data: responseData });
    } catch (error) { next(error); }
};