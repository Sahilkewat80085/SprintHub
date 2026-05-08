const { createClient } = require('@supabase/supabase-js');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         name:
 *           type: string
 *           description: User's full name
 *           minLength: 2
 *           maxLength: 50
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (unique)
 *         password:
 *           type: string
 *           description: Hashed password
 *           minLength: 6
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User role for authorization
 *           default: user
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         _id: 64f1a2b3c4d5e6f7g8h9i0j1
 *         name: John Doe
 *         email: john.doe@example.com
 *         role: user
 *         created_at: 2023-09-01T10:00:00.000Z
 *         updated_at: 2023-09-01T10:00:00.000Z
 */

class User {
  constructor(supabaseData) {
    if (supabaseData) {
      this._id = supabaseData.id;
      this.id = supabaseData.id;
      this.name = supabaseData.name;
      this.email = supabaseData.email;
      this.password = supabaseData.password;
      this.role = supabaseData.role || 'user';
      this.created_at = supabaseData.created_at;
      this.updated_at = supabaseData.updated_at;
    }
  }

  // Static method to find user by email
  static async findByEmail(email) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    return data ? new User(data) : null;
  }

  // Static method to find user by ID
  static async findById(id) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data ? new User(data) : null;
  }

  // Static method to find users by query
  static async find(query = {}) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let supabaseQuery = supabase.from('users').select('*');
    
    // Handle specific query patterns used in controllers
    if (query._id && query._id.$in) {
      supabaseQuery = supabaseQuery.in('id', query._id.$in);
    } else if (query._id) {
      supabaseQuery = supabaseQuery.eq('id', query._id);
    }
    
    const { data, error } = await supabaseQuery;
    
    if (error) throw error;
    return data ? data.map(user => new User(user)) : [];
  }

  // Static method to create user
  static async create(userData) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return new User(data);
  }

  // Static method to get all users (admin only)
  static async findAll() {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data ? data.map(user => new User(user)) : [];
  }

  // Static method to delete user
  static async deleteById(id) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Instance method to save/update user
  async save() {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: this._id,
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return new User(data);
  }

  // Static method to check if email exists
  static async emailExists(email) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  }
}

module.exports = User;
