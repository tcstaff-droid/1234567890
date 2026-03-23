// app.cjs
// This file uses the .cjs extension to bypass the "type: module" restriction in package.json
const { spawn } = require('child_process');
const path = require('path');

// We use 'npx tsx' to run the server.
const child = spawn('npx', ['tsx', 'server.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    PORT: process.env.PORT || 3000 
  }
});

child.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
  }
});
