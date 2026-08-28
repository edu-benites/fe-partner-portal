import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [
  spawn(npm, ['run', 'dev:bff'], { stdio: 'inherit', env: process.env, shell: true }),
  spawn(npm, ['run', 'dev'], { stdio: 'inherit', env: process.env, shell: true }),
];

function stop() {
  processes.forEach((child) => child.kill());
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
processes.forEach((child, index) => child.on('exit', (code) => {
  if (code && code !== 0) {
    process.exitCode = code;
    if (index === 0) stop();
  }
}));
