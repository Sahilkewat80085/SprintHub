require('dotenv').config();
const Project = require('../src/models/Project');

async function test() {
  try {
    console.log('Testing Project.find with $or...');
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // mock uuid
    const projects = await Project.find({
      $or: [{ createdBy: userId }, { members: userId }]
    });
    console.log('Success! Found:', projects.length);
  } catch (err) {
    console.error('Project.find failed:', err.message);
    if (err.details) console.error('Details:', err.details);
    if (err.hint) console.error('Hint:', err.hint);
  }
}

test();
