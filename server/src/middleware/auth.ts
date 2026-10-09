import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma.js';

export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  roleId: string;
  roleName: string;
  roleNameLao: string;
  departmentId?: string | null;
  positionId?: string | null;
  employeeId?: string | null;
  fullNameLao?: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'edoc_super_secret_jwt_key_lao_pdr_2026_secure';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);

  if (!token) {
    res.status(401).json({ success: false, message: 'ກະລຸນາເຂົ້າສູ່ລະບົບ (Unauthorized: No token provided)' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'ບັນຊີຜູ້ໃຊ້ຖືກລະງັບ ຫຼື ບໍ່ພົບໃນລະບົບ (Account deactivated or invalid)' });
      return;
    }

    const permissions = user.role.rolePermissions.map(rp => rp.permission.code);

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      roleNameLao: user.role.nameLao,
      departmentId: user.departmentId,
      positionId: user.positionId,
      employeeId: user.employeeId,
      fullNameLao: user.employee?.fullNameLao || user.username,
      permissions,
    };

    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Session ໝົດອາຍຸ ຫຼື Token ບໍ່ຖືກຕ້ອງ (Invalid or expired token)' });
  }
};
