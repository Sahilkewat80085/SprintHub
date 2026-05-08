const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { catchAsync } = require('../utils/errorHandler');
const { AppError } = require('../utils/errorHandler');

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
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
 *               - projectId
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *                 default: pending
 *               assignedTo:
 *                 type: string
 *                 description: User ID to assign the task to
 *               projectId:
 *                 type: string
 *                 description: Project ID this task belongs to
 *     responses:
 *       201:
 *         description: Task created successfully
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
 *                     task:
 *                       $ref: '#/components/schemas/Task'
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
const createTask = catchAsync(async (req, res, next) => {
  const { title, description, status, assignedTo, projectId } = req.body;

  // Check if project exists and user has access
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user has access to the project
  if (req.user.role !== 'admin' && !project.isMember(req.user.id)) {
    return next(new AppError('Access denied. You are not a member of this project.', 403));
  }

  // Validate assigned user if provided
  if (assignedTo) {
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return next(new AppError('Assigned user not found', 404));
    }

    // Check if assigned user is a project member
    if (!project.isMember(assignedTo)) {
      return next(new AppError('Assigned user must be a project member', 400));
    }
  }

  const task = await Task.create({
    title,
    description,
    status: status || 'pending',
    assignedTo: assignedTo || null,
    projectId,
    createdBy: req.user.id
  });

  // await task.populate('assignedTo', 'name email');
  // await task.populate('createdBy', 'name email');
  // await task.populate('projectId', 'title');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: {
      task
    }
  });
});

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Get all tasks (user's tasks or all if admin)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *         description: Filter by task status
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned user ID
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
 *         description: Number of tasks per page
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
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
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
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
const getTasks = catchAsync(async (req, res, next) => {
  const { projectId, status, assignedTo, page = 1, limit = 10 } = req.query;
  
  // Build filter
  let filter = {};
  
  if (req.user.role !== 'admin') {
    filter = {
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ]
    };
  }
  
  if (projectId) filter.projectId = projectId;
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;

  const skip = (page - 1) * limit;
  
  const tasks = await Task.find(filter, {
    sort: { createdAt: -1 },
    skip: parseInt(skip),
    limit: parseInt(limit)
  });
  // .populate('assignedTo', 'name email')
  // .populate('createdBy', 'name email')
  // .populate('projectId', 'title')

  const totalTasks = await Task.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data: {
      tasks,
      count: tasks.length,
      totalTasks,
      page: parseInt(page),
      pages: Math.ceil(totalTasks / limit)
    }
  });
});

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
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
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - access denied
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
const getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
    // .populate('assignedTo', 'name email')
    // .populate('createdBy', 'name email')
    // .populate('projectId', 'title');

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Check access permissions
  if (!task.canAccess(req.user.id, req.user.role)) {
    return next(new AppError('Access denied. You cannot access this task.', 403));
  }

  res.status(200).json({
    success: true,
    message: 'Task retrieved successfully',
    data: {
      task
    }
  });
});

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
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
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *               assignedTo:
 *                 type: string
 *                 description: User ID to assign the task to
 *     responses:
 *       200:
 *         description: Task updated successfully
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
 *                     task:
 *                       $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - access denied
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
const updateTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Check permissions (only creator or admin can update)
  if (!task.canModify(req.user.id, req.user.role)) {
    return next(new AppError('Access denied. Only task creator can update the task.', 403));
  }

  // Validate assigned user if provided
  if (req.body.assignedTo) {
    const assignedUser = await User.findById(req.body.assignedTo);
    if (!assignedUser) {
      return next(new AppError('Assigned user not found', 404));
    }

    // Check if assigned user is a project member
    const project = await Project.findById(task.projectId);
    if (!project.isMember(req.body.assignedTo)) {
      return next(new AppError('Assigned user must be a project member', 400));
    }
  }

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  // .populate('assignedTo', 'name email')
  //   .populate('createdBy', 'name email')
  //   .populate('projectId', 'title');

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: {
      task: updatedTask
    }
  });
});

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - access denied
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
const deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Check permissions (only creator or admin can delete)
  if (!task.canModify(req.user.id, req.user.role)) {
    return next(new AppError('Access denied. Only task creator can delete the task.', 403));
  }

  await Task.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
});

/**
 * @swagger
 * /api/v1/tasks/stats:
 *   get:
 *     summary: Get task statistics
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task statistics retrieved successfully
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
 *                         totalTasks:
 *                           type: integer
 *                         pendingTasks:
 *                           type: integer
 *                         inProgressTasks:
 *                           type: integer
 *                         completedTasks:
 *                           type: integer
 *                         assignedTasks:
 *                           type: integer
 *       401:
 *         description: Unauthorized - token required
 *       500:
 *         description: Internal server error
 */
const getTaskStats = catchAsync(async (req, res, next) => {
  const stats = await Task.getStats(req.user.id, req.user.role);

  res.status(200).json({
    success: true,
    message: 'Task statistics retrieved successfully',
    data: {
      stats
    }
  });
});

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getTaskStats
};
