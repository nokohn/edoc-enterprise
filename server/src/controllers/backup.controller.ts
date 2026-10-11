import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';

export const exportBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = ((req.query.scope as string) || 'ALL').toUpperCase();

    let incomingDocs: any[] = [];
    let outgoingDocs: any[] = [];

    if (scope === 'INCOMING' || scope === 'ALL') {
      incomingDocs = await prisma.incomingDocument.findMany({
        where: { deletedAt: null },
        include: {
          document: {
            include: {
              attachments: true,
              history: true,
            },
          },
          documentType: true,
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (scope === 'OUTGOING' || scope === 'ALL') {
      outgoingDocs = await prisma.outgoingDocument.findMany({
        where: { deletedAt: null },
        include: {
          document: {
            include: {
              attachments: true,
              history: true,
            },
          },
          documentType: true,
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const backupData = {
      system: 'E-Document Management',
      version: 'v11.10.2026',
      exportedAt: new Date().toISOString(),
      scope,
      totalCount: incomingDocs.length + outgoingDocs.length,
      incomingCount: incomingDocs.length,
      outgoingCount: outgoingDocs.length,
      incomingDocs,
      outgoingDocs,
    };

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'DOWNLOAD',
      module: 'SYSTEM',
      description: `ດາວໂຫລດໄຟລ໌ສຳຮອງຂໍ້ມູນ (BackUp) [ຂອບເຂດ: ${scope}] ລວມ ${backupData.totalCount} ລາຍການ`,
      req,
    });

    res.json({
      success: true,
      data: backupData,
    });
  } catch (error: any) {
    console.error('Error generating backup:', error);
    res.status(500).json({ success: false, message: 'Failed to generate backup', error: error.message });
  }
};

export const restoreBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const backup = req.body;
    if (!backup || (!backup.incomingDocs && !backup.outgoingDocs && !backup.data)) {
      res.status(400).json({ success: false, message: 'ຮູບແບບໄຟລ໌ສຳຮອງຂໍ້ມູນບໍ່ຖືກຕ້ອງ (Invalid backup format)' });
      return;
    }

    const incomingToRestore: any[] = backup.incomingDocs || backup.data?.incomingDocs || [];
    const outgoingToRestore: any[] = backup.outgoingDocs || backup.data?.outgoingDocs || [];

    let restoredIncoming = 0;
    let restoredOutgoing = 0;

    // Get default type and dept fallback
    const defaultType = await prisma.documentType.findFirst();
    const defaultDept = await prisma.department.findFirst();

    if (!defaultType || !defaultDept) {
      res.status(400).json({ success: false, message: 'ລະບົບບໍ່ມີປະເພດເອກະສານ ຫຼື ພະແນກເລີ່ມຕົ້ນ' });
      return;
    }

    // Process Incoming
    for (const item of incomingToRestore) {
      const typeId = item.typeId || item.document?.typeId || defaultType.id;
      const departmentId = item.departmentId || item.document?.departmentId || defaultDept.id;
      const incomingNumber = item.incomingNumber || `INC-${Date.now()}`;
      const docNumber = item.document?.documentNumber || incomingNumber;
      const title = item.subject || item.document?.title || 'ເອກະສານຂາເຂົ້າ';

      // Check if existing document by incomingNumber or docNumber
      const existingIncoming = await prisma.incomingDocument.findFirst({
        where: { incomingNumber },
        include: { document: true },
      });

      if (existingIncoming) {
        // Update existing
        await prisma.incomingDocument.update({
          where: { id: existingIncoming.id },
          data: {
            originalDocNumber: item.originalDocNumber,
            senderOrg: item.senderOrg || 'ບໍ່ລະບຸ',
            senderName: item.senderName,
            subject: title,
            priority: item.priority || 'NORMAL',
            confidentialLevel: item.confidentialLevel || 'NORMAL',
            description: item.description,
            status: item.status || 'NEW',
            notes: item.notes,
          },
        });
        await prisma.document.update({
          where: { id: existingIncoming.documentId },
          data: {
            title,
            priority: item.priority || 'NORMAL',
            status: item.status || 'NEW',
            description: item.description,
          },
        });
        restoredIncoming++;
      } else {
        // Create new Document and IncomingDocument
        const newDoc = await prisma.document.create({
          data: {
            documentNumber: docNumber,
            title,
            typeId,
            departmentId,
            priority: item.priority || 'NORMAL',
            confidentiality: item.confidentialLevel || 'NORMAL',
            status: item.status || 'NEW',
            flowType: 'INCOMING',
            description: item.description,
          },
        });

        await prisma.incomingDocument.create({
          data: {
            documentId: newDoc.id,
            incomingNumber,
            originalDocNumber: item.originalDocNumber,
            docDate: item.docDate ? new Date(item.docDate) : new Date(),
            receivedDate: item.receivedDate ? new Date(item.receivedDate) : new Date(),
            receivedTime: item.receivedTime || '08:30',
            senderOrg: item.senderOrg || 'ບໍ່ລະບຸ',
            senderName: item.senderName,
            subject: title,
            typeId,
            departmentId,
            priority: item.priority || 'NORMAL',
            confidentialLevel: item.confidentialLevel || 'NORMAL',
            status: item.status || 'NEW',
            description: item.description,
            notes: item.notes,
          },
        });
        restoredIncoming++;
      }
    }

    // Process Outgoing
    for (const item of outgoingToRestore) {
      const typeId = item.typeId || item.document?.typeId || defaultType.id;
      const departmentId = item.departmentId || item.document?.departmentId || defaultDept.id;
      const outgoingNumber = item.outgoingNumber || `OUT-${Date.now()}`;
      const docNumber = item.document?.documentNumber || item.docNumber || outgoingNumber;
      const title = item.subject || item.document?.title || 'ເອກະສານຂາອອກ';

      const existingOutgoing = await prisma.outgoingDocument.findFirst({
        where: { outgoingNumber },
        include: { document: true },
      });

      if (existingOutgoing) {
        await prisma.outgoingDocument.update({
          where: { id: existingOutgoing.id },
          data: {
            docNumber: item.docNumber,
            recipientOrg: item.recipientOrg || 'ບໍ່ລະບຸ',
            recipientName: item.recipientName,
            subject: title,
            priority: item.priority || 'NORMAL',
            approvalStatus: item.approvalStatus || 'APPROVED',
            description: item.description,
            notes: item.notes,
          },
        });
        await prisma.document.update({
          where: { id: existingOutgoing.documentId },
          data: {
            title,
            priority: item.priority || 'NORMAL',
            status: item.approvalStatus === 'APPROVED' ? 'APPROVED' : 'NEW',
            description: item.description,
          },
        });
        restoredOutgoing++;
      } else {
        const newDoc = await prisma.document.create({
          data: {
            documentNumber: docNumber,
            title,
            typeId,
            departmentId,
            priority: item.priority || 'NORMAL',
            status: item.approvalStatus === 'APPROVED' ? 'APPROVED' : 'NEW',
            flowType: 'OUTGOING',
            description: item.description,
          },
        });

        await prisma.outgoingDocument.create({
          data: {
            documentId: newDoc.id,
            outgoingNumber,
            docNumber: item.docNumber,
            docDate: item.docDate ? new Date(item.docDate) : new Date(),
            recipientOrg: item.recipientOrg || 'ບໍ່ລະບຸ',
            recipientName: item.recipientName,
            subject: title,
            typeId,
            departmentId,
            priority: item.priority || 'NORMAL',
            approvalStatus: item.approvalStatus || 'APPROVED',
            description: item.description,
            notes: item.notes,
          },
        });
        restoredOutgoing++;
      }
    }

    const totalRestored = restoredIncoming + restoredOutgoing;

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'CREATE',
      module: 'SYSTEM',
      description: `ກູ້ຄືນຂໍ້ມູນ (Restore) ສຳເລັດ: ເອກະສານຂາເຂົ້າ ${restoredIncoming} ລາຍການ, ເອກະສານຂາອອກ ${restoredOutgoing} ລາຍການ`,
      req,
    });

    res.json({
      success: true,
      message: `ກູ້ຄືນຂໍ້ມູນສຳເລັດແລ້ວທັງໝົດ ${totalRestored} ລາຍການ (ຂາເຂົ້າ: ${restoredIncoming}, ຂາອອກ: ${restoredOutgoing})`,
      restoredCount: totalRestored,
      restoredIncoming,
      restoredOutgoing,
    });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ success: false, message: 'Failed to restore backup', error: error.message });
  }
};
