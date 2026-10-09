import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      departmentId,
      assignedToId,
      assignedById,
      status,
      priority,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const where: any = { deletedAt: null };

    if (departmentId) where.departmentId = String(departmentId);
    if (assignedToId) where.assignedToId = String(assignedToId);
    if (assignedById) where.assignedById = String(assignedById);
    if (status) where.status = String(status);
    if (priority) where.priority = String(priority);

    if (search) {
      const q = String(search);
      where.OR = [
        { taskCode: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, items] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          assignedBy: { include: { employee: true } },
          assignedTo: { include: { employee: true } },
          department: true,
          document: true,
          _count: {
            select: {
              comments: true,
              attachments: true,
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: String(sortOrder) }
      })
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        OR: [{ id }, { taskCode: id }],
        deletedAt: null,
      },
      include: {
        assignedBy: { include: { employee: true } },
        assignedTo: { include: { employee: true } },
        department: true,
        document: {
          include: {
            incomingDetails: true,
            outgoingDetails: true,
          }
        },
        comments: {
          include: { user: { include: { employee: true } } },
          orderBy: { createdAt: 'desc' }
        },
        attachments: true,
        history: { orderBy: { createdAt: 'desc' } },
        assignments: {
          include: {
            fromUser: { include: { employee: true } },
            toUser: { include: { employee: true } },
          },
          orderBy: { stepOrder: 'asc' }
        },
        workflowHistory: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task details' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      documentId,
      assignedToId,
      departmentId,
      priority = 'NORMAL',
      startDate,
      dueDate,
      description,
      notes,
    } = req.body;

    if (!title || !assignedToId || !departmentId) {
      res.status(400).json({ success: false, message: 'ກະລຸນາປ້ອນຂໍ້ມູນ: ຫົວຂໍ້ວຽກ, ຜູ້ຮັບຜິດຊອບ, ແລະ ພະແນກ' });
      return;
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.task.count();
    const taskCode = `TSK-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskCode,
        title,
        documentId: documentId || null,
        assignedById: req.user?.id || '',
        assignedToId,
        departmentId,
        priority,
        status: 'NEW',
        progress: 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        description: description || null,
        notes: notes || null,
      },
      include: {
        assignedTo: { include: { employee: true } },
        department: true,
      }
    });

    // Record Assignment
    await prisma.taskAssignment.create({
      data: {
        taskId: task.id,
        fromUserId: req.user?.id || '',
        toUserId: assignedToId,
        stepOrder: 1,
        status: 'PENDING',
        comment: 'ມອບໝາຍວຽກງານ',
      }
    });

    // Audit Log
    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'ASSIGN',
      module: 'TASK',
      recordId: task.id,
      description: `ມອບໝາຍວຽກ ${task.taskCode}: ${task.title} ໃຫ້ ${task.assignedTo?.employee?.fullNameLao || task.assignedTo?.username}`,
      req,
    });

    // Notify Assignee
    await createNotification({
      userId: assignedToId,
      title: 'ວຽກງານໃໝ່ທີ່ໄດ້ຮັບມອບໝາຍ',
      message: `ທ່ານໄດ້ຮັບມອບໝາຍວຽກ: ${task.title}`,
      type: priority === 'URGENT' ? 'URGENT' : 'INFO',
      linkUrl: `/task-tracking?id=${task.id}`,
    });

    res.status(201).json({
      success: true,
      message: 'ມອບໝາຍວຽກງານສຳເລັດແລ້ວ',
      data: task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      priority,
      status,
      progress,
      startDate,
      dueDate,
      description,
      notes,
    } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title,
        priority,
        status,
        progress: progress !== undefined ? Number(progress) : existing.progress,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        completionDate: status === 'COMPLETED' ? new Date() : (status ? null : existing.completionDate),
        description,
        notes,
      },
      include: {
        assignedTo: { include: { employee: true } },
        department: true,
      }
    });

    // Task History
    await prisma.taskHistory.create({
      data: {
        taskId: id,
        userId: req.user?.id,
        userName: req.user?.fullNameLao,
        action: 'ປັບປຸງວຽກງານ',
        statusBefore: existing.status,
        statusAfter: status || existing.status,
        progressBefore: existing.progress,
        progressAfter: progress !== undefined ? Number(progress) : existing.progress,
        comment: 'ປັບປຸງຂໍ້ມູນວຽກງານ',
      }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'UPDATE',
      module: 'TASK',
      recordId: id,
      description: `ອັບເດດວຽກ ${existing.taskCode} -> ສະຖານະ: ${status || existing.status} (${progress || existing.progress}%)`,
      req,
    });

    res.json({ success: true, message: 'ປັບປຸງວຽກງານສຳເລັດ', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    let newProgress = existing.progress;
    if (progress !== undefined) {
      newProgress = Number(progress);
    } else if (status === 'COMPLETED') {
      newProgress = 100;
    } else if (status === 'IN_PROGRESS' && existing.progress === 0) {
      newProgress = 20;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status,
        progress: newProgress,
        completionDate: status === 'COMPLETED' ? new Date() : null,
      }
    });

    await prisma.taskHistory.create({
      data: {
        taskId: id,
        userId: req.user?.id,
        userName: req.user?.fullNameLao,
        action: 'ປ່ຽນສະຖານະວຽກ',
        statusBefore: existing.status,
        statusAfter: status,
        progressBefore: existing.progress,
        progressAfter: newProgress,
      }
    });

    res.json({ success: true, message: 'ປ່ຽນສະຖານະວຽກສຳເລັດ', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update task status' });
  }
};

export const addTaskComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ success: false, message: 'Comment content is required' });
      return;
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        userId: req.user?.id || '',
        content,
      },
      include: {
        user: { include: { employee: true } }
      }
    });

    res.status(201).json({ success: true, message: 'ເພີ່ມຄຳເຫັນສຳເລັດ', data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'DELETE',
      module: 'TASK',
      recordId: id,
      description: `ລຶບວຽກ ${task.taskCode}: ${task.title}`,
      req,
    });

    res.json({ success: true, message: 'ລຶບວຽກສຳເລັດແລ້ວ' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};
