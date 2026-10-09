import { Router } from 'express';
import {
  getAllDocuments,
  getDocumentById,
  addDocumentComment,
  uploadDocumentAttachment,
  getDocumentTypes,
} from '../controllers/document.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllDocuments);
router.get('/meta/types', getDocumentTypes);
router.get('/:id', getDocumentById);
router.post('/:id/comments', addDocumentComment);
router.post('/:id/attachments', upload.single('attachment'), uploadDocumentAttachment);

export default router;
