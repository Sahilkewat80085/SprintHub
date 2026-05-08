require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const fields = ['id', 'title', 'description', 'status', 'project_id', 'created_by', 'assigned_to'];
  console.log('Checking tasks columns...');
  for (const field of fields) {
    const { error } = await supabase.from('tasks').select(field).limit(0);
    if (error) {
      console.log(`Column ${field}: ❌ (Error: ${error.message})`);
    } else {
      console.log(`Column ${field}: ✅`);
    }
  }
}

test();
