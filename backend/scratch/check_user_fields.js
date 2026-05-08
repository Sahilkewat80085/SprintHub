require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const fields = ['id', 'email', 'name', 'role', 'created_at', 'updated_at'];
  console.log('Checking users columns...');
  for (const field of fields) {
    const { error } = await supabase.from('users').select(field).limit(0);
    if (error) {
      console.log(`Column ${field}: ❌ (Error: ${error.message})`);
    } else {
      console.log(`Column ${field}: ✅`);
    }
  }
}

test();
