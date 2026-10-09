import { Router } from 'express';
import { exportBackup, restoreBackup } from '../controllers/backup.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// BackUp Export & Restore endpoints
router.get('/export', authenticateToken, exportBackup);
router.post('/restore', authenticateToken, restoreBackup);

export default router;
