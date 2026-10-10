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

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'edoc_super_secret_jwt_key_lao_pdr_2026_secure';
}

import { createApp } from './app.js';

const PORT = process.env.PORT || 5000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 E-Document Management Server running on http://localhost:${PORT}`);
  console.log(`📡 REST API mounted at http://localhost:${PORT}/api`);
  console.log(`📁 File uploads served at http://localhost:${PORT}/uploads`);
  console.log(`====================================================`);
});
