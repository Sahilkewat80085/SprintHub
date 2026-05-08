const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to convert between formats
const supabaseToModel = (supabaseData, modelName) => {
  if (!supabaseData) return null;
  
  // Convert Supabase format to Mongoose-like format
  return {
    _id: supabaseData.id,
    ...supabaseData,
    save: async function() {
      const { data, error } = await supabase
        .from(modelName)
        .upsert(this, { onConflict: 'id' });
      if (error) throw error;
      return data[0];
    },
    deleteOne: async function() {
      const { error } = await supabase
        .from(modelName)
        .delete()
        .eq('id', this._id);
      if (error) throw error;
      return this;
    },
    populate: function(path) {
      // This is a simplified version - in real implementation,
      // you'd need to handle joins properly
      return this;
    }
  };
};

const connectDB = async () => {
  try {
    // Test connection by checking if we can access the service
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      throw error;
    }

    console.log('✅ Supabase Connected successfully');
    
    // Make supabase client available globally
    global.supabase = supabase;
    global.supabaseToModel = supabaseToModel;
    
    return supabase;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
