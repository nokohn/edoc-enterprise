import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, departmentId, roleId, page = 1, limit = 50 } = req.query;

    const where: any = { deletedAt: null };
    if (departmentId) where.departmentId = String(departmentId);
    if (roleId) where.roleId = String(roleId);
    if (search) {
      const q = String(search);
      where.OR = [
        { username: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { employee: { fullNameLao: { contains: q } } },
        { employee: { fullNameEn: { contains: q } } },
        { employee: { employeeCode: { contains: q } } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          role: true,
          department: true,
          position: true,
          employee: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        phone: u.phone,
        roleId: u.roleId,
        role: u.role,
        departmentId: u.departmentId,
        department: u.department,
        positionId: u.positionId,
        position: u.position,
        employeeId: u.employeeId,
        employee: u.employee,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      password,
      email,
      phone,
      roleId,
      departmentId,
      positionId,
      firstName,
      lastName,
      fullNameLao,
      fullNameEn,
      gender,
      employeeCode,
      avatarUrl,
    } = req.body;

    if (!username || !password || !roleId || !fullNameLao) {
      res.status(400).json({ success: false, message: 'ກະລຸນາປ້ອນຂໍ້ມູນທີ່ຈຳເປັນ (Username, password, role, and full name are required)' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'ຊື່ຜູ້ໃຊ້ນີ້ມີຢູ່ໃນລະບົບແລ້ວ (Username already exists)' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let empCode = employeeCode?.trim();
    if (empCode) {
      const existingEmp = await prisma.employee.findUnique({ where: { employeeCode: empCode } });
      if (existingEmp) {
        res.status(400).json({ success: false, message: `ລະຫັດພະນັກງານ "${empCode}" ມີຢູ່ໃນລະບົບແລ້ວ` });
        return;
      }
    } else {
      const count = await prisma.employee.count();
      let candidateNum = count + 1;
      while (true) {
        const candidate = `EMP-${String(candidateNum).padStart(4, '0')}`;
        const existingEmp = await prisma.employee.findUnique({ where: { employeeCode: candidate } });
        if (!existingEmp) {
          empCode = candidate;
          break;
        }
        candidateNum++;
      }
    }

    const nameParts = fullNameLao.trim().split(/\s+/);
    const resolvedFirstName = firstName?.trim() || nameParts[0] || fullNameLao.trim();
    const resolvedLastName = lastName?.trim() || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

    // Transactionally create Employee and User
    const user = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          employeeCode: empCode,
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          fullNameLao: fullNameLao.trim(),
          fullNameEn: fullNameEn?.trim() || null,
          gender: gender || 'OTHER',
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          departmentId: departmentId || null,
          positionId: positionId || null,
          roleId,
          avatarUrl: avatarUrl || null,
          status: 'ACTIVE',
        }
      });

      return await tx.user.create({
        data: {
          username: username.trim(),
          passwordHash,
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          roleId,
          departmentId: departmentId || null,
          positionId: positionId || null,
          employeeId: employee.id,
          avatarUrl: avatarUrl || null,
          isActive: true,
        },
        include: {
          role: true,
          department: true,
          position: true,
          employee: true,
        }
      });
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'CREATE',
      module: 'USER',
      recordId: user.id,
      description: `ສ້າງບັນຊີຜູ້ໃຊ້ໃໝ່: ${user.username} (${fullNameLao})`,
      req,
    });

    res.status(201).json({ success: true, message: 'ສ້າງບັນຊີຜູ້ໃຊ້ສຳເລັດແລ້ວ', data: user });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating user' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      phone,
      roleId,
      departmentId,
      positionId,
      firstName,
      lastName,
      fullNameLao,
      fullNameEn,
      isActive,
      password,
      avatarUrl,
    } = req.body;

    const user = await prisma.user.findUnique({ where: { id }, include: { employee: true } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const userUpdateData: any = {
      email: email !== undefined ? email : user.email,
      phone: phone !== undefined ? phone : user.phone,
      roleId: roleId || user.roleId,
      departmentId: departmentId !== undefined ? departmentId : user.departmentId,
      positionId: positionId !== undefined ? positionId : user.positionId,
      isActive: isActive !== undefined ? isActive : user.isActive,
    };

    if (username && username.trim() && username.trim() !== user.username) {
      const trimmedUsername = username.trim();
      const existingUser = await prisma.user.findUnique({ where: { username: trimmedUsername } });
      if (existingUser) {
        res.status(400).json({ success: false, message: `ຊື່ຜູ້ໃຊ້ "${trimmedUsername}" ມີຢູ່ໃນລະບົບແລ້ວ (Username already exists)` });
        return;
      }
      userUpdateData.username = trimmedUsername;
    }

    if (avatarUrl !== undefined) {
      userUpdateData.avatarUrl = avatarUrl;
    }

    if (password) {
      userUpdateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: userUpdateData,
      include: { role: true, department: true, position: true, employee: true }
    });

    if (user.employeeId) {
      await prisma.employee.update({
        where: { id: user.employeeId },
        data: {
          fullNameLao: fullNameLao !== undefined ? fullNameLao.trim() : undefined,
          fullNameEn: fullNameEn !== undefined ? fullNameEn?.trim() || null : undefined,
          firstName: firstName !== undefined ? firstName.trim() : (fullNameLao ? fullNameLao.trim().split(/\s+/)[0] : undefined),
          lastName: lastName !== undefined ? lastName.trim() : (fullNameLao ? (fullNameLao.trim().split(/\s+/).slice(1).join(' ') || '') : undefined),
          departmentId: departmentId !== undefined ? departmentId : undefined,
          positionId: positionId !== undefined ? positionId : undefined,
          roleId: roleId !== undefined ? roleId : undefined,
          phone: phone !== undefined ? phone?.trim() || null : undefined,
          email: email !== undefined ? email?.trim() || null : undefined,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        }
      });
    }

    const finalUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true, department: true, position: true, employee: true }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'UPDATE',
      module: 'USER',
      recordId: id,
      description: `ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້: ${updatedUser.username}`,
      req,
    });

    res.json({ success: true, message: 'ແກ້ໄຂຂໍ້ມູນຜູ້ໃຊ້ສຳເລັດ', data: finalUser || updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.username === 'admin') {
      res.status(400).json({ success: false, message: 'ບໍ່ສາມາດລຶບບັນຊີ Super Admin ໄດ້' });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'DELETE',
      module: 'USER',
      recordId: id,
      description: `ລະງັບການນຳໃຊ້ຜູ້ໃຊ້: ${user.username}`,
      req,
    });

    res.json({ success: true, message: 'ລຶບ / ລະງັບຜູ້ໃຊ້ສຳເລັດແລ້ວ' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};

export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
};

export const getPositions = async (req: Request, res: Response): Promise<void> => {
  try {
    const positions = await prisma.position.findMany({ orderBy: { level: 'desc' } });
    res.json({ success: true, data: positions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch positions' });
  }
};
