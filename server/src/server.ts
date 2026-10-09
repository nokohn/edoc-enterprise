import dotenv from 'dotenv';
dotenv.config();

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
