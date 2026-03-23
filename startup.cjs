// startup.cjs
const { spawn } = require('child_process');
const path = require('path');

console.log("Starting Thames City Backend via node --import...");

const child = spawn('node', ['--import', 'tsx', 'server.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    NODE_ENV: 'production',
    PORT: process.env.PORT || 3000,
    ESBUILD_BINARY_PATH: '' 
  }
});

// Ensure the child process is killed when this process exits
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, killing child process...');
  child.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, killing child process...');
  child.kill();
  process.exit(0);
});

child.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

child.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code || 0);
});
