import { Request } from 'express';
import { prisma } from '../database/prisma.js';

export interface AuditParams {
  userId?: string | null;
  userName?: string | null;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'APPROVE' | 'REJECT' | 'DOWNLOAD' | 'VIEW';
  module: 'AUTH' | 'DOCUMENT' | 'TASK' | 'USER' | 'DEPARTMENT' | 'WORKFLOW' | 'REPORT' | 'SYSTEM';
  recordId?: string | null;
  description: string;
  details?: any;
  req?: Request;
}

export const logAudit = async (params: AuditParams) => {
  try {
    let ipAddress = '127.0.0.1';
    let userAgent = 'Unknown';

    if (params.req) {
      ipAddress = (params.req.headers['x-forwarded-for'] as string) || params.req.socket.remoteAddress || '127.0.0.1';
      userAgent = params.req.headers['user-agent'] || 'Unknown';
    }

    let uName = params.userName;
    if (!uName && params.userId) {
      const u = await prisma.user.findUnique({
        where: { id: params.userId },
        include: { employee: true }
      });
      uName = u?.employee?.fullNameLao || u?.username || 'Unknown';
    }

    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userName: uName || 'ລະບົບ (System)',
        action: params.action,
        module: params.module,
        recordId: params.recordId || null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
        userAgent: userAgent.substring(0, 255),
        description: params.description,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
      }
    });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};
