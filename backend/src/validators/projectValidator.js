const { body, validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

/**
 * Validation rules for creating/updating projects
 */
const validateProject = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project title must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Project title can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Project description must be between 10 and 1000 characters'),
  
  body('priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  
  body('status')
    .optional()
    .isIn(['planned', 'active', 'completed'])
    .withMessage('Status must be planned, active, or completed'),
  
  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array of user IDs')
    .custom((members) => {
      if (members.length > 20) {
        throw new Error('Project cannot have more than 20 members');
      }
      return true;
    }),
  
  body('members.*')
    .optional()
    .isUUID()
    .withMessage('Each member must be a valid user ID')
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
  validateProject,
  checkValidation
};
