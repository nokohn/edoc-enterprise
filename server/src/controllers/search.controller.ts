import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length === 0) {
      res.json({ success: true, data: { documents: [], tasks: [], employees: [], departments: [] } });
      return;
    }

    const query = String(q).trim();

    const [documents, tasks, employees, departments] = await Promise.all([
      prisma.document.findMany({
        where: {
          deletedAt: null,
          OR: [
            { documentNumber: { contains: query } },
            { title: { contains: query } },
            { description: { contains: query } },
          ]
        },
        include: { documentType: true, department: true },
        take: 8,
      }),
      prisma.task.findMany({
        where: {
          deletedAt: null,
          OR: [
            { taskCode: { contains: query } },
            { title: { contains: query } },
            { description: { contains: query } },
          ]
        },
        include: { assignedTo: { include: { employee: true } }, department: true },
        take: 8,
      }),
      prisma.employee.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullNameLao: { contains: query } },
            { fullNameEn: { contains: query } },
            { employeeCode: { contains: query } },
            { phone: { contains: query } },
            { email: { contains: query } },
          ]
        },
        include: { department: true, position: true },
        take: 8,
      }),
      prisma.department.findMany({
        where: {
          deletedAt: null,
          OR: [
            { code: { contains: query } },
            { nameLao: { contains: query } },
            { name: { contains: query } },
          ]
        },
        take: 5,
      })
    ]);

    res.json({
      success: true,
      data: {
        documents,
        tasks,
        employees,
        departments,
      }
    });
  } catch (error) {
    console.error('Error during global search:', error);
    res.status(500).json({ success: false, message: 'Failed to perform search' });
  }
};
