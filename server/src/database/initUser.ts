import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';

export async function verifyAndSeedDefaultUser(): Promise<boolean> {
  try {
    const userCount = await prisma.user.count().catch(() => -1);
    if (userCount === 0 || userCount === -1) {
      console.log('🌱 Initializing default Super Admin user...');
      let role = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: 'Super Admin',
            nameLao: 'ຜູ້ດູແລລະບົບສູງສຸດ',
            description: 'ຄວບຄຸມລະບົບ ແລະ ຈັດການສິດທັງໝົດ',
            isSystem: true,
          },
        });
      }

      const passwordHash = await bcrypt.hash('admin123456', 10);
      await prisma.user.upsert({
        where: { username: 'admin' },
        update: { isActive: true, email: 'nokohn@gmail.com' },
        create: {
          username: 'admin',
          passwordHash,
          email: 'nokohn@gmail.com',
          roleId: role.id,
          isActive: true,
        },
      });
      console.log('✅ Default Super Admin (admin / admin123456) ready!');
      return true;
    }
  } catch (err: any) {
    console.warn('DB check note in verifyAndSeedDefaultUser:', err?.message || err);
  }
  return false;
}
