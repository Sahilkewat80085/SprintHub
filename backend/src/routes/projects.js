const express = require('express');
const projectController = require('../controllers/projectController');
const { verifyToken, authorizeRoles, checkProjectAccess } = require('../middleware/auth');
const { validateProject, checkValidation } = require('../validators/projectValidator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management operations
 */

// Protected routes
router.post('/', verifyToken, validateProject, checkValidation, projectController.createProject);
router.get('/', verifyToken, projectController.getProjects);
router.get('/stats', verifyToken, projectController.getProjectStats);
router.get('/:id', verifyToken, checkProjectAccess, projectController.getProject);
router.put('/:id', verifyToken, checkProjectAccess, projectController.updateProject);
router.delete('/:id', verifyToken, checkProjectAccess, projectController.deleteProject);

module.exports = router;
