import { prisma } from '../database/prisma.js';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'APPROVAL';
  linkUrl?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'INFO',
        linkUrl: params.linkUrl || null,
        isRead: false,
      }
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

export const notifyUsers = async (userIds: string[], title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'APPROVAL' = 'INFO', linkUrl?: string) => {
  for (const uid of userIds) {
    if (uid) {
      await createNotification({ userId: uid, title, message, type, linkUrl });
    }
  }
};
