const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - priority
 *         - status
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         title:
 *           type: string
 *           description: Project title
 *           minLength: 3
 *           maxLength: 100
 *         description:
 *           type: string
 *           description: Project description
 *           maxLength: 1000
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Project priority level
 *         status:
 *           type: string
 *           enum: [planned, active, completed]
 *           description: Project status
 *         createdBy:
 *           type: string
 *           description: User ID of the project creator
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who are project members
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Project creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         _id: 64f1a2b3c4d5e6f7g8h9i0j1
 *         title: E-commerce Platform
 *         description: Building a modern e-commerce platform with React and Node.js
 *         priority: high
 *         status: active
 *         createdBy: 64f1a2b3c4d5e6f7g8h9i0j2
 *         members: ["64f1a2b3c4d5e6f7g8h9i0j2", "64f1a2b3c4d5e6f7g8h9i0j3"]
 *         createdAt: 2023-09-01T10:00:00.000Z
 *         updatedAt: 2023-09-01T10:00:00.000Z
 */

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    minlength: [3, 'Project title must be at least 3 characters long'],
    maxlength: [100, 'Project title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [1000, 'Project description cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    required: [true, 'Project priority is required'],
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high'
    },
    default: 'medium'
  },
  status: {
    type: String,
    required: [true, 'Project status is required'],
    enum: {
      values: ['planned', 'active', 'completed'],
      message: 'Status must be planned, active, or completed'
    },
    default: 'planned'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project creator is required']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ createdAt: -1 });

// Virtual for project tasks
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId'
});

// Pre-save middleware to automatically add creator to members
projectSchema.pre('save', function(next) {
  if (this.isNew && !this.members.includes(this.createdBy)) {
    this.members.push(this.createdBy);
  }
  next();
});

// Pre-remove middleware to clean up related tasks
projectSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Remove all tasks associated with this project
    await mongoose.model('Task').deleteMany({ projectId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get projects by user
projectSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { createdBy: userId },
      { members: userId }
    ]
  }).populate('createdBy', 'name email').populate('members', 'name email');
};

// Static method to get project statistics
projectSchema.statics.getStats = async function(userId, userRole) {
  let matchCondition = {};
  
  if (userRole !== 'admin') {
    matchCondition = {
      $or: [
        { createdBy: userId },
        { members: userId }
      ]
    };
  }

  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        plannedProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'planned'] }, 1, 0] }
        },
        activeProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedProjects: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        highPriorityProjects: {
          $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalProjects: 0,
    plannedProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    highPriorityProjects: 0
  };
};

// Instance method to check if user is member
projectSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.toString() === userId.toString());
};

// Instance method to check if user is owner
projectSchema.methods.isOwner = function(userId) {
  return this.createdBy.toString() === userId.toString();
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
