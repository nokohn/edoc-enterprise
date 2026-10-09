import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import departmentRoutes from './department.routes.js';
import incomingRoutes from './incoming.routes.js';
import outgoingRoutes from './outgoing.routes.js';
import documentRoutes from './document.routes.js';
import taskRoutes from './task.routes.js';
import notificationRoutes from './notification.routes.js';
import calendarRoutes from './calendar.routes.js';
import reportRoutes from './report.routes.js';
import auditRoutes from './audit.routes.js';
import settingRoutes from './setting.routes.js';
import searchRoutes from './search.routes.js';
import workflowRoutes from './workflow.routes.js';
import backupRoutes from './backup.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/incoming-documents', incomingRoutes);
router.use('/outgoing-documents', outgoingRoutes);
router.use('/documents', documentRoutes);
router.use('/workflow', workflowRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/calendar', calendarRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/settings', settingRoutes);
router.use('/search', searchRoutes);
router.use('/backup', backupRoutes);

export default router;
