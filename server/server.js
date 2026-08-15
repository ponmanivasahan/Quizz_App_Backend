const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { sequelize } = require('./models');
const { errorHandler } = require('./middleware/errorMiddleware');


const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
});

// Set up routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/admin/leaderboard', require('./routes/adminLeaderboardRoutes'));

app.get('/', (req, res) => {
    res.send('Quiz API is running...');
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Proper startup sequence: authenticate -> sync -> listen
async function startServer() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Ensure database tables exist
        await sequelize.sync();
        console.log('Database synced successfully.');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Unable to connect to the database:");
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Full error:", error);
        process.exit(1); // Fail clearly instead of keeping process hanging
    }
}

startServer();
