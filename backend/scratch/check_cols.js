require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Checking projects columns...');
  const { data, error } = await supabase.from('projects').select('*').limit(0);
  if (error) {
    console.error('Error:', error.message);
  } else {
    // This won't give columns if empty, wait.
    // We can use a query to information_schema
    const { data: cols, error: colError } = await supabase.rpc('get_columns', { table_name: 'projects' });
    // If rpc get_columns doesn't exist, we can try a raw query if we have service role
    // But supabase-js doesn't support raw SQL easily.
    
    // Let's try to just select one row and see the keys
    const { data: rows } = await supabase.from('projects').select('*').limit(1);
    if (rows && rows.length > 0) {
      console.log('Columns:', Object.keys(rows[0]));
    } else {
      console.log('No rows found to determine columns.');
    }
  }
}

test();
