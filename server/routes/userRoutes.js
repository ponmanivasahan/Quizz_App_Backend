const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, adminOnly, getUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;