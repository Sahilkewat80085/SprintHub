const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { validateRegister, validateLogin, checkValidation } = require('../validators/authValidator');
const authLimiter = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// Public routes
router.post('/register', authLimiter, validateRegister, checkValidation, authController.register);
router.post('/login', authLimiter, validateLogin, checkValidation, authController.login);

// Protected routes
router.get('/me', verifyToken, authController.getMe);

// Admin only routes
router.get('/users', verifyToken, authorizeRoles('admin'), authController.getAllUsers);
router.delete('/users/:id', verifyToken, authorizeRoles('admin'), authController.deleteUser);

module.exports = router;
