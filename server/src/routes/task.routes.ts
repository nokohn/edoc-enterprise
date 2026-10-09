import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  addTaskComment,
  deleteTask,
} from '../controllers/task.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.post('/:id/status', updateTaskStatus);
router.post('/:id/comments', addTaskComment);
router.delete('/:id', deleteTask);

export default router;
