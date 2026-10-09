import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('AUDIT_LOGS_VIEW'), getAuditLogs);

export default router;
