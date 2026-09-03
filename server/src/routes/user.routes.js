const express = require('express');
const { verifyToken } = require('../middlewares/auth.middleware');
const { authorizeRole } = require('../middlewares/role.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Get the current user's role (used by frontend during login/auth state change)
router.get('/me', verifyToken, userController.getCurrentUserRole);

// Manage users (Super Admin / Admin only)
// POST /api/users - Create a new user (with role)
router.post('/', verifyToken, authorizeRole(['Super Admin', 'Admin']), userController.createUser);

// GET /api/users - List all users
router.get('/', verifyToken, authorizeRole(['Super Admin', 'Admin']), userController.getUsers);

// PUT /api/users/:id - Update user role or details
router.put('/:id', verifyToken, authorizeRole(['Super Admin', 'Admin']), userController.updateUser);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', verifyToken, authorizeRole(['Super Admin', 'Admin']), userController.deleteUser);

module.exports = router;
