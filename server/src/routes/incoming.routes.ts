import { Router } from 'express';
import {
  getIncomingDocs,
  getIncomingDocById,
  createIncomingDoc,
  updateIncomingDoc,
  deleteIncomingDoc,
  assignIncomingDoc,
} from '../controllers/incoming.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getIncomingDocs);
router.get('/:id', getIncomingDocById);
router.post('/', upload.single('attachment'), createIncomingDoc);
router.put('/:id', upload.single('attachment'), updateIncomingDoc);
router.delete('/:id', requirePermission('DOC_DELETE'), deleteIncomingDoc);
router.post('/:id/assign', assignIncomingDoc);

export default router;
