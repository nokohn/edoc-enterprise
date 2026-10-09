import { Router } from 'express';
import { getDashboardStats, exportReportExcel } from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardStats);
router.get('/export/excel', exportReportExcel);

export default router;
