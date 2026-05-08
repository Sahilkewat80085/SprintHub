const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - status
 *         - projectId
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         title:
 *           type: string
 *           description: Task title
 *           minLength: 3
 *           maxLength: 100
 *         description:
 *           type: string
 *           description: Task description
 *           maxLength: 1000
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *           description: Task status
 *         assignedTo:
 *           type: string
 *           description: User ID of the assigned user
 *         projectId:
 *           type: string
 *           description: Project ID this task belongs to
 *         createdBy:
 *           type: string
 *           description: User ID of the task creator
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Task creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         _id: 64f1a2b3c4d5e6f7g8h9i0j1
 *         title: Implement user authentication
 *         description: Add JWT-based authentication with login and register endpoints
 *         status: in-progress
 *         assignedTo: 64f1a2b3c4d5e6f7g8h9i0j3
 *         projectId: 64f1a2b3c4d5e6f7g8h9i0j4
 *         createdBy: 64f1a2b3c4d5e6f7g8h9i0j2
 *         createdAt: 2023-09-01T10:00:00.000Z
 *         updatedAt: 2023-09-01T10:00:00.000Z
 */

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [3, 'Task title must be at least 3 characters long'],
    maxlength: [100, 'Task title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    required: [true, 'Task status is required'],
    enum: {
      values: ['pending', 'in-progress', 'completed'],
      message: 'Status must be pending, in-progress, or completed'
    },
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
taskSchema.index({ projectId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdAt: -1 });

// Pre-save middleware to validate project membership
taskSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('assignedTo')) {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.projectId);
    
    if (!project) {
      return next(new Error('Project not found'));
    }

    // If task is assigned to someone, they must be a project member
    if (this.assignedTo) {
      const User = mongoose.model('User');
      const assignedUser = await User.findById(this.assignedTo);
      
      if (!assignedUser) {
        return next(new Error('Assigned user not found'));
      }

      if (!project.isMember(this.assignedTo.toString())) {
        return next(new Error('Assigned user must be a project member'));
      }
    }
  }
  next();
});

// Pre-remove middleware to update project statistics
taskSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Could add project statistics updates here if needed
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get tasks by project
taskSchema.statics.findByProject = function(projectId, userId, userRole) {
  let filter = { projectId };
  
  // If not admin, ensure user has access to the project
  if (userRole !== 'admin') {
    const Project = mongoose.model('Project');
    const project = Project.findById(projectId);
    
    if (!project || (!project.isMember(userId) && !project.isOwner(userId))) {
      return null; // No access
    }
  }

  return this.find(filter)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get tasks by user
taskSchema.statics.findByUser = function(userId, userRole) {
  let filter = {
    $or: [
      { createdBy: userId },
      { assignedTo: userId }
    ]
  };

  return this.find(filter)
    .populate('projectId', 'title')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get task statistics
taskSchema.statics.getStats = async function(userId, userRole) {
  let matchCondition = {};
  
  if (userRole !== 'admin') {
    matchCondition = {
      $or: [
        { createdBy: userId },
        { assignedTo: userId }
      ]
    };
  }

  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        pendingTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
        },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        assignedTasks: {
          $sum: { $cond: [{ $ne: ['$assignedTo', null] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    assignedTasks: 0
  };
};

// Instance method to check if user can access task
taskSchema.methods.canAccess = function(userId, userRole) {
  // Admin can access any task
  if (userRole === 'admin') return true;
  
  // Creator can access task
  if (this.createdBy.toString() === userId.toString()) return true;
  
  // Assigned user can access task
  if (this.assignedTo && this.assignedTo.toString() === userId.toString()) return true;
  
  return false;
};

// Instance method to check if user can modify task
taskSchema.methods.canModify = function(userId, userRole) {
  // Admin can modify any task
  if (userRole === 'admin') return true;
  
  // Creator can modify task
  if (this.createdBy.toString() === userId.toString()) return true;
  
  return false;
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
