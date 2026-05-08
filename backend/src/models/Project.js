const { createClient } = require('@supabase/supabase-js');

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
 *         description:
 *           type: string
 *           description: Project description
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *         status:
 *           type: string
 *           enum: [planned, active, completed]
 *         createdBy:
 *           type: string
 *           description: User ID of the project creator
 *         members:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

class Project {
  constructor(supabaseData) {
    if (supabaseData) {
      this._id = supabaseData.id;
      this.id = supabaseData.id;
      this.title = supabaseData.title;
      this.description = supabaseData.description;
      this.priority = supabaseData.priority;
      this.status = supabaseData.status;
      this.createdBy = supabaseData.created_by || supabaseData.createdBy;
      this.members = supabaseData.members || [];
      this.createdAt = supabaseData.created_at || supabaseData.createdAt;
      this.updatedAt = supabaseData.updated_at || supabaseData.updatedAt;
    }
  }

  // Dummy populate to prevent crashes in controllers
  async populate(path, select) {
    // In a real implementation, we would fetch related data here.
    // For now, we return this to avoid breaking the controller flow.
    return this;
  }

  // Static method to find project by ID
  static async findById(id) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data ? new Project(data) : null;
  }

  // Static method to find projects
  static async find(query = {}, options = {}) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let supabaseQuery = supabase.from('projects').select('*');
    
    if (query.$or) {
      // Supabase OR filter
      const orFilterParts = [];
      
      for (const cond of query.$or) {
        const key = Object.keys(cond)[0];
        const val = cond[key];
        const supabaseKey = key === 'createdBy' ? 'created_by' : (key === 'members' ? 'members' : key);
        
        if (key === 'members') {
          // Only add members filter if we are sure it exists or handle it gracefully
          // For now, we'll try to include it but we need to handle the potential error
          orFilterParts.push(`${supabaseKey}.cs.{${val}}`);
        } else {
          orFilterParts.push(`${supabaseKey}.eq.${val}`);
        }
      }
      
      supabaseQuery = supabaseQuery.or(orFilterParts.join(','));
    } else {
      if (query.createdBy) supabaseQuery = supabaseQuery.eq('created_by', query.createdBy);
      if (query.status) supabaseQuery = supabaseQuery.eq('status', query.status);
      if (query.priority) supabaseQuery = supabaseQuery.eq('priority', query.priority);
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
    
    if (error) {
      // Handle missing members column gracefully
      if (error.message.includes('column projects.members does not exist') && query.$or) {
        console.warn('⚠️ members column missing, falling back to created_by only');
        // Retry without members filter
        const fallbackFilter = query.$or.filter(cond => !cond.members).map(cond => {
          const key = Object.keys(cond)[0];
          const val = cond[key];
          const supabaseKey = key === 'createdBy' ? 'created_by' : key;
          return `${supabaseKey}.eq.${val}`;
        }).join(',');
        
        const { data: retryData, error: retryError } = await supabase.from('projects').select('*').or(fallbackFilter);
        if (retryError) throw retryError;
        return retryData ? retryData.map(p => new Project(p)) : [];
      }
      throw error;
    }
    return data ? data.map(p => new Project(p)) : [];
  }

  // Static method to create project
  static async create(projectData) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const mappedData = {
      title: projectData.title,
      description: projectData.description,
      priority: projectData.priority,
      status: projectData.status || 'planned',
      created_by: projectData.createdBy
    };

    // Only add members if provided (and hope the column exists)
    // If it fails, we'll know it's because of missing column
    if (projectData.members) {
      mappedData.members = projectData.members;
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert([mappedData])
      .select()
      .single();
    
    if (error) {
      if (error.message.includes('column "members" of relation "projects" does not exist')) {
        // Retry without members
        delete mappedData.members;
        const { data: retryData, error: retryError } = await supabase
          .from('projects')
          .insert([mappedData])
          .select()
          .single();
        if (retryError) throw retryError;
        return new Project(retryData);
      }
      throw error;
    }
    return new Project(data);
  }

  // Static method to count documents
  static async countDocuments(query = {}) {
    const projects = await this.find(query);
    return projects.length;
  }

  // Static method to find by ID and update
  static async findByIdAndUpdate(id, updateData, options = {}) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const mappedUpdate = { ...updateData };
    if (mappedUpdate.createdBy) {
      mappedUpdate.created_by = mappedUpdate.createdBy;
      delete mappedUpdate.createdBy;
    }
    
    const { data, error } = await supabase
      .from('projects')
      .update(mappedUpdate)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) {
      if (error.message.includes('column "members" of relation "projects" does not exist')) {
        delete mappedUpdate.members;
        const { data: retryData, error: retryError } = await supabase
          .from('projects')
          .update(mappedUpdate)
          .eq('id', id)
          .select()
          .maybeSingle();
        if (retryError) throw retryError;
        return retryData ? new Project(retryData) : null;
      }
      throw error;
    }
    return data ? new Project(data) : null;
  }

  // Static method to find by ID and delete
  static async findByIdAndDelete(id) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data ? new Project(data) : null;
  }

  // Static method to get stats (Mocking the aggregation)
  static async getStats(userId, userRole) {
    const projects = await this.find(userRole !== 'admin' ? {
      $or: [{ createdBy: userId }, { members: userId }]
    } : {});

    return {
      totalProjects: projects.length,
      plannedProjects: projects.filter(p => p.status === 'planned').length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      highPriorityProjects: projects.filter(p => p.priority === 'high').length
    };
  }

  // Instance method to check if user is member
  isMember(userId) {
    if (!userId) return false;
    // Owner is always a member
    if (this.isOwner(userId)) return true;
    return this.members.some(member => member.toString() === userId.toString());
  }

  // Instance method to check if user is owner
  isOwner(userId) {
    return this.createdBy.toString() === userId.toString();
  }
}

module.exports = Project;
