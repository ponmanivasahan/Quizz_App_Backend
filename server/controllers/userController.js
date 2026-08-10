const { User } = require('../models');
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json({ success: true, data: users });
    } catch (error) { next(error); }
};
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) { next(error); }
};
exports.updateUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (req.user.role !== 'admin' && req.user.id !== user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
        
        const { name, email, password } = req.body;
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) {
            const bcrypt = require('bcryptjs');
            user.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
        }
        await user.save();
        res.json({ success: true, message: 'User updated', data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) { next(error); }
};
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await user.destroy();
        res.json({ success: true, message: 'User deleted' });
    } catch (error) { next(error); }
};