import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      module,
      action,
      page = 1,
      limit = 50,
    } = req.query;

    const where: any = {};
    if (module) where.module = String(module);
    if (action) where.action = String(action);
    if (search) {
      const q = String(search);
      where.OR = [
        { userName: { contains: q } },
        { description: { contains: q } },
        { ipAddress: { contains: q } },
        { recordId: { contains: q } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
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
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};
