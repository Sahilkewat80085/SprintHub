const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { catchAsync } = require('../utils/errorHandler');
const { AppError } = require('../utils/errorHandler');

/**
 * Generate JWT token
 * @param {String} userId - User ID
 * @returns {String} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Create and send token response
 * @param {Object} user - User object
 * @param {Number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  // Create user object without password
  const userWithoutPassword = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
  
  res.status(statusCode).json({
    success: true,
    message: 'Operation successful',
    data: {
      token,
      user: userWithoutPassword
    }
  });
};

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: User role (optional, defaults to user)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - validation error or duplicate email
 *       500:
 *         description: Internal server error
 */
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  console.log('Registration attempt:', { name, email, role: role || 'user' });

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create new user
  try {
    const user = await User.create({
      name,
      email,
      password, 
      role: role || 'user'
    });

    console.log('User created successfully:', user);
    createSendToken(user, 201, res);
  } catch (error) {
    console.error('Error creating user:', error);
    return next(new AppError('Failed to create user: ' + error.message, 500));
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);  
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // In production, you'd verify password with bcrypt
  // For now, We'll do a simple comparison (you should add bcrypt)
  if (user.password !== password) {
    return next(new AppError('Invalid email or password', 401));
  }

  createSendToken(user, 200, res);
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - token required
 *       500:
 *         description: Internal server error
 */
const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user
    }
  });
});

/**
 * @swagger
 * /api/v1/auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         description: Internal server error
 */
const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users,
      count: users.length
    }
  });
});

/**
 * @swagger
 * /api/v1/auth/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  deleteUser
};
