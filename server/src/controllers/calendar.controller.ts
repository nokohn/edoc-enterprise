import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { start, end, departmentId } = req.query;

    const where: any = {};
    if (departmentId) where.departmentId = String(departmentId);

    // Fetch custom events
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        department: true,
        document: true,
        task: true,
      },
      orderBy: { startDate: 'asc' }
    });

    // Also fetch tasks with dueDate as calendar items
    const tasksWithDueDate = await prisma.task.findMany({
      where: {
        dueDate: { not: null },
        deletedAt: null,
      },
      include: { department: true, assignedTo: { include: { employee: true } } }
    });

    const taskEvents = tasksWithDueDate.map(t => ({
      id: `task-${t.id}`,
      title: `[ວຽກ] ${t.title}`,
      description: t.description,
      eventType: 'TASK_DUE',
      startDate: t.dueDate!,
      endDate: t.dueDate!,
      allDay: true,
      color: t.status === 'COMPLETED' ? '#10b981' : (t.priority === 'URGENT' ? '#ef4444' : '#3b82f6'),
      taskId: t.id,
      department: t.department,
      status: t.status,
      assignedTo: t.assignedTo?.employee?.fullNameLao,
    }));

    res.json({
      success: true,
      data: [...events, ...taskEvents]
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar events' });
  }
};

export const createCalendarEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, eventType = 'EVENT', startDate, endDate, allDay = false, location, color, departmentId } = req.body;

    if (!title || !startDate) {
      res.status(400).json({ success: false, message: 'Title and start date are required' });
      return;
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        eventType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        allDay: Boolean(allDay),
        location,
        color: color || '#2563eb',
        departmentId: departmentId || null,
        createdById: req.user?.id,
      },
      include: { department: true }
    });

    res.status(201).json({ success: true, message: 'ສ້າງກິດຈະກຳສຳເລັດແລ້ວ', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create calendar event' });
  }
};

export const updateCalendarEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, eventType, startDate, endDate, allDay, location, color, departmentId } = req.body;

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title,
        description,
        eventType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        allDay: allDay !== undefined ? Boolean(allDay) : undefined,
        location,
        color,
        departmentId: departmentId || null,
      },
      include: { department: true }
    });

    res.json({ success: true, message: 'ແກ້ໄຂກິດຈະກຳສຳເລັດ', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update calendar event' });
  }
};

export const deleteCalendarEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.calendarEvent.delete({ where: { id } });
    res.json({ success: true, message: 'ລຶບກິດຈະກຳສຳເລັດ' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete calendar event' });
  }
};
