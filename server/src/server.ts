import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from root or server/.env
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} else if (fs.existsSync(path.resolve(process.cwd(), 'server/.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
} else {
  dotenv.config();
}

// Smart SQLite database path resolution across local and cloud environments
const possibleDbPaths = [
  path.resolve(process.cwd(), 'server/prisma/dev.db'),
  path.resolve(process.cwd(), 'prisma/dev.db'),
  path.resolve(process.cwd(), 'dev.db'),
];
const foundDb = possibleDbPaths.find((p) => fs.existsSync(p));

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = foundDb ? `file:${foundDb}` : 'file:./server/prisma/dev.db';
} else if (process.env.DATABASE_URL === 'file:./dev.db' && foundDb && !fs.existsSync(path.resolve(process.cwd(), 'dev.db'))) {
  process.env.DATABASE_URL = `file:${foundDb}`;
}

// Ensure uploads storage directory exists
const uploadsDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'edoc_super_secret_jwt_key_lao_pdr_2026_secure';
}

import { createApp } from './app.js';
import { prisma } from './database/prisma.js';
import { verifyAndSeedDefaultUser } from './database/initUser.js';

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 E-Document Management Server running on http://localhost:${PORT}`);
  console.log(`📡 REST API mounted at http://localhost:${PORT}/api`);
  console.log(`📁 File uploads served at http://localhost:${PORT}/uploads`);
  console.log(`====================================================`);
  await verifyAndSeedDefaultUser();
});
