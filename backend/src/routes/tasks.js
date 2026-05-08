const express = require('express');
const taskController = require('../controllers/taskController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { validateTask, validateTaskStatus, checkValidation } = require('../validators/taskValidator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management operations
 */

// Protected routes
router.post('/', verifyToken, authorizeRoles('admin'), validateTask, checkValidation, taskController.createTask);
router.get('/', verifyToken, taskController.getTasks);
router.get('/stats', verifyToken, taskController.getTaskStats);
router.get('/:id', verifyToken, taskController.getTask);
router.put('/:id', verifyToken, validateTask, checkValidation, taskController.updateTask);
router.delete('/:id', verifyToken, authorizeRoles('admin'), taskController.deleteTask);

// Alternative route for updating just the status
router.patch('/:id/status', verifyToken, validateTaskStatus, checkValidation, taskController.updateTask);

module.exports = router;
