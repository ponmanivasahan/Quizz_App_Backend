const fs = require('fs');
const path = require('path');

const dirs = ['middleware', 'controllers', 'routes', 'validators'];
dirs.forEach(d => {
    const p = path.join(__dirname, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p);
});
const authMiddleware = `const jwt = require('jsonwebtoken');
const { User } = require('../models');
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };`;

const roleMiddleware = `const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }
};

const studentOnly = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as student' });
    }
};

module.exports = { adminOnly, studentOnly };`;

const errorMiddleware = `const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };`;

const validationMiddleware = `const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    next();
};

module.exports = { validate };`;

fs.writeFileSync(path.join(__dirname, 'middleware', 'authMiddleware.js'), authMiddleware);
fs.writeFileSync(path.join(__dirname, 'middleware', 'roleMiddleware.js'), roleMiddleware);
fs.writeFileSync(path.join(__dirname, 'middleware', 'errorMiddleware.js'), errorMiddleware);
fs.writeFileSync(path.join(__dirname, 'middleware', 'validationMiddleware.js'), validationMiddleware);

// CONTROLLERS
const authController = `const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await User.create({ name, email, password: hashedPassword, role: 'student' });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user.id) }
        });
    } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                success: true,
                message: 'Login successful',
                data: { id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user.id) }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) { next(error); }
};

exports.getMe = async (req, res, next) => {
    res.json({ success: true, data: req.user });
};`;

fs.writeFileSync(path.join(__dirname, 'controllers', 'authController.js'), authController);

console.log("Middleware and Auth Controller created.");
