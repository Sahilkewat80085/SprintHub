const { body, validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

/**
 * Validation rules for creating/updating tasks
 */
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Task title must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Task title can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Task description must be between 10 and 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be pending, in-progress, or completed'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned user must be a valid user ID'),
  
  body('projectId')
    .isMongoId()
    .withMessage('Project must be a valid project ID')
];

/**
 * Validation rules for updating task status
 */
const validateTaskStatus = [
  body('status')
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be pending, in-progress, or completed')
];

/**
 * Middleware to check validation results
 */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  
  next();
};

module.exports = {
  validateTask,
  validateTaskStatus,
  checkValidation
};
