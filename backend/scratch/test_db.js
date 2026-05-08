require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Testing projects table...');
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  if (error) {
    console.error('Error fetching projects:', error.message);
  } else {
    console.log('Projects table exists. Found:', data.length, 'rows');
  }

  console.log('Testing tasks table...');
  const { data: tasks, error: taskError } = await supabase.from('tasks').select('*').limit(1);
  if (taskError) {
    console.error('Error fetching tasks:', taskError.message);
  } else {
    console.log('Tasks table exists. Found:', tasks.length, 'rows');
  }
}

test();
