import { Router } from 'express';
import {
  getDepartments,
  getDepartmentTree,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getDepartments);
router.get('/tree', getDepartmentTree);
router.post('/', requirePermission('DEPARTMENT_MANAGE'), createDepartment);
router.put('/:id', requirePermission('DEPARTMENT_MANAGE'), updateDepartment);
router.delete('/:id', requirePermission('DEPARTMENT_MANAGE'), deleteDepartment);

export default router;
