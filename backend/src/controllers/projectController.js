const Project = require('../models/Project');
const User = require('../models/User');
const { catchAsync } = require('../utils/errorHandler');
const { AppError } = require('../utils/errorHandler');

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               status:
 *                 type: string
 *                 enum: [planned, active, completed]
 *                 default: planned
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add as members
 *     responses:
 *       201:
 *         description: Project created successfully
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
 *                     project:
 *                       $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - token required
 *       500:
 *         description: Internal server error
 */
const createProject = catchAsync(async (req, res, next) => {
  // Only admin can create projects
  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Only admins can create projects.', 403));
  }

  const { title, description, priority, status, members } = req.body;

  // Validate members if provided
  if (members && members.length > 0) {
    const validUsers = await User.find({ _id: { $in: members } });
    if (validUsers.length !== members.length) {
      return next(new AppError('One or more member IDs are invalid', 400));
    }
  }

  const project = await Project.create({
    title,
    description,
    priority,
    status: status || 'planned',
    createdBy: req.user.id,
    members: members || []
  });

  // Population is handled manually or mocked in the new model
  // await project.populate('createdBy', 'name email');
  // await project.populate('members', 'name email');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: {
      project
    }
  });
});

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all projects (user's projects or all if admin)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, active, completed]
 *         description: Filter by project status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by project priority
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of projects per page
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
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
 *                     projects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 *                     count:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - token required
 *       500:
 *         description: Internal server error
 */
const getProjects = catchAsync(async (req, res, next) => {
  const { status, priority, page = 1, limit = 10 } = req.query;
  
  // Build filter
  let filter = {};
  
  if (req.user.role !== 'admin') {
    filter = {
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    };
  }
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const skip = (page - 1) * limit;
  
  const projects = await Project.find(filter, {
    sort: { createdAt: -1 },
    skip: parseInt(skip),
    limit: parseInt(limit)
  });

  const totalProjects = await Project.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Projects retrieved successfully',
    data: {
      projects,
      count: projects.length,
      totalProjects,
      page: parseInt(page),
      pages: Math.ceil(totalProjects / limit)
    }
  });
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get a single project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
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
 *                     project:
 *                       $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
const getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
    // .populate('createdBy', 'name email')
    // .populate('members', 'name email');

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check access permissions
  if (req.user.role !== 'admin' && !project.isMember(req.user.id)) {
    return next(new AppError('Access denied. You are not a member of this project.', 403));
  }

  res.status(200).json({
    success: true,
    message: 'Project retrieved successfully',
    data: {
      project
    }
  });
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               status:
 *                 type: string
 *                 enum: [planned, active, completed]
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to set as members
 *     responses:
 *       200:
 *         description: Project updated successfully
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
 *                     project:
 *                       $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
const updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Only admin can update projects
  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Only admins can update projects.', 403));
  }

  // Validate members if provided
  if (req.body.members && req.body.members.length > 0) {
    const validUsers = await User.find({ _id: { $in: req.body.members } });
    if (validUsers.length !== req.body.members.length) {
      return next(new AppError('One or more member IDs are invalid', 400));
    }
  }

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  // .populate('createdBy', 'name email').populate('members', 'name email');

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: {
      project: updatedProject
    }
  });
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Only admin can delete projects
  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Only admins can delete projects.', 403));
  }

  await Project.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully'
  });
});

/**
 * @swagger
 * /api/v1/projects/stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project statistics retrieved successfully
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalProjects:
 *                           type: integer
 *                         plannedProjects:
 *                           type: integer
 *                         activeProjects:
 *                           type: integer
 *                         completedProjects:
 *                           type: integer
 *                         highPriorityProjects:
 *                           type: integer
 *       401:
 *         description: Unauthorized - token required
 *       500:
 *         description: Internal server error
 */
const getProjectStats = catchAsync(async (req, res, next) => {
  const stats = await Project.getStats(req.user.id, req.user.role);

  res.status(200).json({
    success: true,
    message: 'Project statistics retrieved successfully',
    data: {
      stats
    }
  });
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectStats
};
