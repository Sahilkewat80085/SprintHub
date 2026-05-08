const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');

/**
 * Middleware to verify JWT token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new AppError('Token is valid but user not found.', 401));
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired.', 401));
    } else {
      return next(new AppError('Authentication failed.', 401));
    }
  }
};

/**
 * Middleware to authorize users based on roles
 * @param {...String} roles - Allowed roles
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const allowedRoles = roles.map(role => role.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      console.log(`[AUTH] Access denied for user ${req.user.email}. Role: ${userRole}, Required: ${allowedRoles}`);
      return next(new AppError(
        `Access denied. ${req.user.role} role is not authorized to access this resource.`,
        403
      ));
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource or is admin
 * @param {String} resourceField - Field name in the resource that contains the owner ID
 * @returns {Function} Express middleware function
 */
const checkOwnership = (resourceField = 'createdBy') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user is the owner of the resource
    const resource = req.resource || req.project || req.task;
    
    if (!resource) {
      return next(new AppError('Resource not found in request.', 404));
    }

    const ownerId = resource[resourceField];
    
    if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
      return next(new AppError(
        'Access denied. You can only access your own resources.',
        403
      ));
    }

    next();
  };
};

/**
 * Middleware to check if user can access project (owner or member)
 * @returns {Function} Express middleware function
 */
const checkProjectAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    // Admin can access any project
    if (req.user.role === 'admin') {
      return next();
    }

    const Project = require('../models/Project');
    const projectId = req.params.id || req.params.projectId;

    if (!projectId) {
      return next(new AppError('Project ID is required.', 400));
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    // Check if user is owner or member
    const isOwner = project.createdBy.toString() === req.user._id.toString();
    const isMember = project.members.some(member => member.toString() === req.user._id.toString());

    if (!isOwner && !isMember) {
      return next(new AppError(
        'Access denied. You are not a member of this project.',
        403
      ));
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
  authorizeRoles,
  checkOwnership,
  checkProjectAccess
};
