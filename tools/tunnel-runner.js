const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const cloudflared = path.resolve(__dirname, 'cloudflared.exe');
const urlFile = path.resolve(__dirname, 'current-tunnel-url.txt');
const liveUrlFile = path.resolve(__dirname, 'LIVE-URL.txt');
const localQrFile = path.resolve(__dirname, 'edoc-qr-code.png');

function getDesktopPath() {
  const oneDriveDesktop = path.join(process.env.USERPROFILE || '', 'OneDrive', 'Desktop');
  const normalDesktop = path.join(process.env.USERPROFILE || '', 'Desktop');
  if (fs.existsSync(oneDriveDesktop)) return oneDriveDesktop;
  if (fs.existsSync(normalDesktop)) return normalDesktop;
  return null;
}

function updateShortcutsAndQr(liveUrl) {
  // Update local files
  fs.writeFileSync(urlFile, liveUrl, 'utf-8');
  fs.writeFileSync(liveUrlFile, liveUrl, 'utf-8');

  // Update Desktop shortcut
  const desktop = getDesktopPath();
  if (desktop) {
    try {
      const desktopShortcut = path.join(desktop, 'E-Document Management (Online 24-7).url');
      fs.writeFileSync(desktopShortcut, `[InternetShortcut]\nURL=${liveUrl}\n`, 'utf-8');
      console.log('✅ Updated Desktop shortcut:', desktopShortcut);

      // Download QR Code for smartphone scan
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(liveUrl)}`;
      const desktopQrFile = path.join(desktop, 'QR-Code-Mobile-Login.png');
      
      const fileStream = fs.createWriteStream(localQrFile);
      https.get(qrApiUrl, (res) => {
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          try {
            fs.copyFileSync(localQrFile, desktopQrFile);
            console.log('✅ Updated Desktop QR Code:', desktopQrFile);
          } catch (e) {}
        });
      }).on('error', () => {});
    } catch (err) {
      console.error('Failed to update desktop shortcut:', err.message);
    }
  }
}

function startTunnel() {
  console.log('🚀 Starting Cloudflare Tunnel runner (HTTP/2 Mode)...');

  const proc = spawn(cloudflared, ['tunnel', '--protocol', 'http2', '--url', 'http://localhost:5000']);

  proc.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);

    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const liveUrl = match[0];
      updateShortcutsAndQr(liveUrl);
      console.log('\n======================================================');
      console.log('🎉 CLOUDFLARE 24/7 LIVE URL:', liveUrl);
      console.log('======================================================\n');
    }

    if (text.includes('Unauthorized: Tunnel not found')) {
      console.log('⚠️ Tunnel expired on Cloudflare edge. Re-spawning clean tunnel in 3s...');
      proc.kill();
    }
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
  });

  proc.on('close', (code) => {
    console.log(`Cloudflare process exited with code ${code}. Reconnecting in 3s...`);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();
