require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const fields = ['id', 'title', 'description', 'priority', 'status', 'created_by', 'createdBy', 'members'];
  for (const field of fields) {
    const { error } = await supabase.from('projects').select(field).limit(0);
    if (error) {
      console.log(`Column ${field}: ❌ (Error: ${error.message})`);
    } else {
      console.log(`Column ${field}: ✅`);
    }
  }
}

test();
