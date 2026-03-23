// app.js
// This version is compatible with Node 20+ and "type": "module" projects
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// We use 'npx tsx' to run the server. This is the most reliable way 
// to run TypeScript on shared hosting without a complex build step.
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
