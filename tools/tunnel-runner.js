const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const cloudflared = path.resolve(__dirname, 'cloudflared.exe');
const urlFile = path.resolve(__dirname, 'current-tunnel-url.txt');
const liveUrlFile = path.resolve(__dirname, 'LIVE-URL.txt');

console.log('🚀 Starting Cloudflare Tunnel runner...');

const proc = spawn(cloudflared, ['tunnel', '--url', 'http://localhost:5000']);

proc.stderr.on('data', (data) => {
  const text = data.toString();
  process.stderr.write(text);
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    fs.writeFileSync(urlFile, match[0], 'utf-8');
    fs.writeFileSync(liveUrlFile, match[0], 'utf-8');
    console.log('\n======================================================');
    console.log('🎉 CLOUDFLARE 24/7 LIVE URL:', match[0]);
    console.log('======================================================\n');
  }
});

proc.stdout.on('data', (data) => {
  process.stdout.write(data.toString());
});

proc.on('close', (code) => {
  console.log(`Cloudflare process exited with code ${code}`);
  process.exit(code || 0);
});
