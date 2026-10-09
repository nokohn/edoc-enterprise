import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        head: {
          include: { employee: true }
        },
        deputyHead: {
          include: { employee: true }
        },
        subDepts: true,
        _count: {
          select: {
            users: true,
            employees: true,
            documents: true,
            tasks: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ success: true, data: departments });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

export const getDepartmentTree = async (req: Request, res: Response): Promise<void> => {
  try {
    const rootDepts = await prisma.department.findMany({
      where: { parentId: null, deletedAt: null },
      include: {
        head: { include: { employee: true } },
        subDepts: {
          include: {
            head: { include: { employee: true } },
            employees: true,
          }
        },
        employees: true,
      }
    });

    res.json({ success: true, data: rootDepts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch department hierarchy' });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, nameLao, description, headId, deputyHeadId, parentId } = req.body;

    if (!code || !nameLao) {
      res.status(400).json({ success: false, message: 'ກະລຸນາໃສ່ລະຫັດ ແລະ ຊື່ພະແນກ (Code and Lao name are required)' });
      return;
    }

    const exists = await prisma.department.findUnique({ where: { code } });
    if (exists) {
      res.status(400).json({ success: false, message: 'ລະຫັດພະແນກນີ້ມີຢູ່ໃນລະບົບແລ້ວ (Department code already exists)' });
      return;
    }

    const department = await prisma.department.create({
      data: {
        code,
        name: name || nameLao,
        nameLao,
        description,
        headId: headId || null,
        deputyHeadId: deputyHeadId || null,
        parentId: parentId || null,
      },
      include: { head: true, deputyHead: true }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'CREATE',
      module: 'DEPARTMENT',
      recordId: department.id,
      description: `ເພີ່ມພະແນກໃໝ່: ${department.nameLao} (${department.code})`,
      req,
    });

    res.status(201).json({ success: true, message: 'ເພີ່ມພະແນກສຳເລັດແລ້ວ', data: department });
  } catch (error: any) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, message: 'Error creating department' });
  }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, name, nameLao, description, headId, deputyHeadId, parentId, isActive } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        code,
        name,
        nameLao,
        description,
        headId: headId || null,
        deputyHeadId: deputyHeadId || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: { head: true, deputyHead: true }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'UPDATE',
      module: 'DEPARTMENT',
      recordId: department.id,
      description: `ແກ້ໄຂຂໍ້ມູນພະແນກ: ${department.nameLao}`,
      req,
    });

    res.json({ success: true, message: 'ແກ້ໄຂຂໍ້ມູນພະແນກສຳເລັດ', data: department });
  } catch (error: any) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, message: 'Error updating department' });
  }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    await prisma.department.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'DELETE',
      module: 'DEPARTMENT',
      recordId: id,
      description: `ລຶບພະແນກ: ${department.nameLao}`,
      req,
    });

    res.json({ success: true, message: 'ລຶບພະແນກສຳເລັດແລ້ວ' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deleting department' });
  }
};
