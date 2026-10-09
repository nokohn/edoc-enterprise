import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getPositions,
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.post('/', requirePermission('USER_CREATE'), createUser);
router.put('/:id', requirePermission('USER_EDIT'), updateUser);
router.delete('/:id', requirePermission('USER_DELETE'), deleteUser);

router.get('/meta/roles', getRoles);
router.get('/meta/positions', getPositions);

export default router;
