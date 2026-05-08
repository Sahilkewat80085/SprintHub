require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Checking project_members table...');
  const { data, error } = await supabase.from('project_members').select('*').limit(0);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('project_members table exists! ✅');
  }
}

test();
