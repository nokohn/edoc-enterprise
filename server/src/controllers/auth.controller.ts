import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edoc_super_secret_jwt_key_lao_pdr_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ (Username and password are required)' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        },
        department: true,
        position: true,
        employee: true,
      }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (Invalid credentials)' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'ບັນຊີຂອງທ່ານຖືກລະງັບຊົ່ວຄາວ (Account is disabled)' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (Invalid credentials)' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const permissions = user.role.rolePermissions.map(rp => rp.permission.code);

    const token = jwt.sign(
      { userId: user.id, username: user.username, roleId: user.roleId },
      JWT_SECRET,
      { expiresIn: (JWT_EXPIRES_IN as any) || '7d' }
    );

    // Audit log
    await logAudit({
      userId: user.id,
      userName: user.employee?.fullNameLao || user.username,
      action: 'LOGIN',
      module: 'AUTH',
      description: `ຜູ້ໃຊ້ ${user.username} ເຂົ້າສູ່ລະບົບສຳເລັດ`,
      req,
    });

    res.json({
      success: true,
      message: 'ເຂົ້າສູ່ລະບົບສຳເລັດ (Login successful)',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          roleId: user.roleId,
          roleName: user.role.name,
          roleNameLao: user.role.nameLao,
          departmentId: user.departmentId,
          departmentName: user.department?.nameLao,
          positionName: user.position?.nameLao,
          employeeId: user.employeeId,
          fullNameLao: user.employee?.fullNameLao || user.username,
          fullNameEn: user.employee?.fullNameEn,
          avatarUrl: user.avatarUrl || user.employee?.avatarUrl,
          permissions,
        }
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'ເກີດຂໍ້ຜິດພາດໃນລະບົບ (Internal server error)' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        userName: req.user.fullNameLao,
        action: 'LOGOUT',
        module: 'AUTH',
        description: `ຜູ້ໃຊ້ ${req.user.username} ອອກຈາກລະບົບ`,
        req,
      });
    }
    res.json({ success: true, message: 'ອອກຈາກລະບົບສຳເລັດ (Logged out)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging out' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        },
        department: true,
        position: true,
        employee: true,
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const permissions = user.role.rolePermissions.map(rp => rp.permission.code);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        roleName: user.role.name,
        roleNameLao: user.role.nameLao,
        departmentId: user.departmentId,
        departmentName: user.department?.nameLao,
        positionName: user.position?.nameLao,
        employeeId: user.employeeId,
        fullNameLao: user.employee?.fullNameLao || user.username,
        fullNameEn: user.employee?.fullNameEn,
        avatarUrl: user.avatarUrl || user.employee?.avatarUrl,
        permissions,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};
