import { Router } from 'express';
import {
  getOutgoingDocs,
  getOutgoingDocById,
  createOutgoingDoc,
  updateOutgoingDoc,
  deleteOutgoingDoc,
  approveOutgoingDoc,
  rejectOutgoingDoc,
} from '../controllers/outgoing.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getOutgoingDocs);
router.get('/:id', getOutgoingDocById);
router.post('/', upload.single('attachment'), createOutgoingDoc);
router.put('/:id', upload.single('attachment'), updateOutgoingDoc);
router.delete('/:id', requirePermission('DOC_DELETE'), deleteOutgoingDoc);
router.post('/:id/approve', approveOutgoingDoc);
router.post('/:id/reject', rejectOutgoingDoc);

export default router;
