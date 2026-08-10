const fs = require('fs');
const path = require('path');

// Update .env port to 3000
let envData = fs.readFileSync('.env', 'utf8');
envData = envData.replace(/PORT=\d+/, 'PORT=3000');
if (!envData.includes('PORT=')) envData += '\nPORT=3000';
fs.writeFileSync('.env', envData);

const routesDir = path.join(__dirname, 'routes');
const controllersDir = path.join(__dirname, 'controllers');

// Create user routes
fs.writeFileSync(path.join(routesDir, 'userRoutes.js'), `const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, adminOnly, getUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;`);

// Create quiz routes
fs.writeFileSync(path.join(routesDir, 'quizRoutes.js'), `const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzes, getQuiz, updateQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/', protect, adminOnly, createQuiz);
router.get('/', protect, getQuizzes);
router.get('/:id', protect, getQuiz);
router.put('/:id', protect, adminOnly, updateQuiz);
router.delete('/:id', protect, adminOnly, deleteQuiz);

module.exports = router;`);

// Create attempt routes
fs.writeFileSync(path.join(routesDir, 'attemptRoutes.js'), `const express = require('express');
const router = express.Router();
const { startAttempt, submitAttempt, getMyAttempts } = require('../controllers/attemptController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start/:quizId', protect, startAttempt);
router.post('/:attemptId/submit', protect, submitAttempt);
router.get('/my', protect, getMyAttempts);

module.exports = router;`);

// Create analytics controller
fs.writeFileSync(path.join(controllersDir, 'analyticsController.js'), `exports.getOverview = async (req, res, next) => {
    res.json({ success: true, data: { message: 'Analytics overview (mocked)' } });
};`);

// Create analytics routes
fs.writeFileSync(path.join(routesDir, 'analyticsRoutes.js'), `const express = require('express');
const router = express.Router();
const { getOverview } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.get('/overview', protect, adminOnly, getOverview);

module.exports = router;`);

// Update server.js
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(/\/\/ Set up routes[\s\S]*?(?=app\.get\('\/',)/, 
`// Set up routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

`);
fs.writeFileSync('server.js', serverJs);

console.log('Routes and server.js updated.');
