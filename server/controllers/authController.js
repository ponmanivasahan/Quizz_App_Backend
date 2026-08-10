const { User } = require('../models');
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
};