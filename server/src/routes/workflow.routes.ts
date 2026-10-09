import { Router } from 'express';
import {
  getWorkflowSteps,
  updateWorkflowStep,
  getPendingApprovals,
  getWorkflowHistory,
  approveDocumentStep,
} from '../controllers/workflow.controller.js';
import { rejectOutgoingDoc } from '../controllers/outgoing.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/steps', getWorkflowSteps);
router.put('/steps/:id', updateWorkflowStep);
router.get('/pending', getPendingApprovals);
router.get('/history', getWorkflowHistory);
router.post('/:id/approve', approveDocumentStep);
router.post('/:id/reject', rejectOutgoingDoc);

export default router;
