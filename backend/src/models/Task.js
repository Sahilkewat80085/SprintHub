const { createClient } = require('@supabase/supabase-js');

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
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *         assignedTo:
 *           type: string
 *         projectId:
 *           type: string
 *         createdBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

class Task {
  constructor(supabaseData) {
    if (supabaseData) {
      this._id = supabaseData.id;
      this.id = supabaseData.id;
      this.title = supabaseData.title;
      this.description = supabaseData.description;
      this.status = supabaseData.status;
      this.assignedTo = supabaseData.assigned_to || supabaseData.assignedTo;
      this.projectId = supabaseData.project_id || supabaseData.projectId;
      this.createdBy = supabaseData.created_by || supabaseData.createdBy;
      this.createdAt = supabaseData.created_at || supabaseData.createdAt;
      this.updatedAt = supabaseData.updated_at || supabaseData.updatedAt;
    }
  }

  // Dummy populate to prevent crashes in controllers
  async populate(path, select) {
    return this;
  }

  // Static method to find task by ID
  static async findById(id) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data ? new Task(data) : null;
  }

  // Static method to find tasks
  static async find(query = {}, options = {}) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let supabaseQuery = supabase.from('tasks').select('*');
    
    if (query.projectId) supabaseQuery = supabaseQuery.eq('project_id', query.projectId);
    if (query.status) supabaseQuery = supabaseQuery.eq('status', query.status);
    
    if (query.$or) {
      const orFilter = query.$or.map(cond => {
        const key = Object.keys(cond)[0];
        const val = cond[key];
        const supabaseKey = key === 'createdBy' ? 'created_by' : (key === 'assignedTo' ? 'assigned_to' : key);
        return `${supabaseKey}.eq.${val}`;
      }).join(',');
      supabaseQuery = supabaseQuery.or(orFilter);
    }

    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const ascending = options.sort[sortKey] === 1;
      const supabaseSortKey = sortKey === 'createdAt' ? 'created_at' : sortKey;
      supabaseQuery = supabaseQuery.order(supabaseSortKey, { ascending });
    } else {
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    }

    if (options.skip !== undefined) {
      supabaseQuery = supabaseQuery.range(options.skip, options.skip + (options.limit || 10) - 1);
    } else if (options.limit !== undefined) {
      supabaseQuery = supabaseQuery.limit(options.limit);
    }

    const { data, error } = await supabaseQuery;
    if (error) throw error;
    return data ? data.map(t => new Task(t)) : [];
  }

  // Static method to count documents
  static async countDocuments(query = {}) {
    const tasks = await this.find(query);
    return tasks.length;
  }

  // Static method to create task
  static async create(taskData) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const mappedData = {
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'pending',
      project_id: taskData.projectId,
      created_by: taskData.createdBy,
      assigned_to: taskData.assignedTo || null
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([mappedData])
      .select()
      .single();
    
    if (error) throw error;
    return new Task(data);
  }

  // Static method to find by ID and update
  static async findByIdAndUpdate(id, updateData, options = {}) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const mappedUpdate = { ...updateData };
    if (mappedUpdate.projectId) {
      mappedUpdate.project_id = mappedUpdate.projectId;
      delete mappedUpdate.projectId;
    }
    if (mappedUpdate.createdBy) {
      mappedUpdate.created_by = mappedUpdate.createdBy;
      delete mappedUpdate.createdBy;
    }
    if (mappedUpdate.assignedTo) {
      mappedUpdate.assigned_to = mappedUpdate.assignedTo;
      delete mappedUpdate.assignedTo;
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(mappedUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return new Task(data);
  }

  // Static method to find by ID and delete
  static async findByIdAndDelete(id) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data ? new Task(data) : null;
  }

  // Static method to get stats
  static async getStats(userId, userRole) {
    const tasks = await this.find(userRole !== 'admin' ? {
      $or: [{ createdBy: userId }, { assignedTo: userId }]
    } : {});

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      assignedTasks: tasks.filter(t => t.assignedTo).length
    };
  }

  // Instance method to check if user can access task
  canAccess(userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.createdBy.toString() === userId.toString()) return true;
    if (this.assignedTo && this.assignedTo.toString() === userId.toString()) return true;
    return false;
  }

  // Instance method to check if user can modify task
  canModify(userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.createdBy.toString() === userId.toString()) return true;
    return false;
  }
}

module.exports = Task;
