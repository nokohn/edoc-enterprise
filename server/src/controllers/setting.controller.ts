import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { category: 'asc' } });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch system settings' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { settings } = req.body; // array of { key, value }

    if (Array.isArray(settings)) {
      for (const s of settings) {
        await prisma.systemSetting.upsert({
          where: { key: s.key },
          update: { value: String(s.value) },
          create: { key: s.key, value: String(s.value), description: s.description || null, category: s.category || 'GENERAL' }
        });
      }
    }

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'UPDATE',
      module: 'SYSTEM',
      description: 'ອັບເດດການຕັ້ງຄ່າລະບົບ (System Settings)',
      req,
    });

    const updated = await prisma.systemSetting.findMany();
    res.json({ success: true, message: 'ບັນທຶກການຕັ້ງຄ່າລະບົບສຳເລັດ', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update system settings' });
  }
};
