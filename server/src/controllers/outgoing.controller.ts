import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';

export const getOutgoingDocs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      departmentId,
      approvalStatus,
      priority,
      typeId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const where: any = { deletedAt: null };

    if (departmentId && departmentId !== 'undefined' && departmentId !== '') {
      where.departmentId = String(departmentId);
    }
    if (approvalStatus && approvalStatus !== 'undefined' && approvalStatus !== '') {
      where.approvalStatus = String(approvalStatus);
    }
    if (priority && priority !== 'undefined' && priority !== '') {
      where.priority = String(priority);
    }
    if (typeId && typeId !== 'undefined' && typeId !== '') {
      where.typeId = String(typeId);
    }

    if (search && search !== 'undefined' && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { outgoingNumber: { contains: q } },
        { docNumber: { contains: q } },
        { subject: { contains: q } },
        { recipientOrg: { contains: q } },
        { recipientName: { contains: q } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, items] = await Promise.all([
      prisma.outgoingDocument.count({ where }),
      prisma.outgoingDocument.findMany({
        where,
        include: {
          document: {
            include: {
              attachments: true,
              comments: {
                include: { user: { include: { employee: true } } }
              },
              workflowHistory: { orderBy: { createdAt: 'desc' } }
            }
          },
          documentType: true,
          department: true,
        },
        skip,
        take: Number(limit),
        orderBy: { [String(sortBy)]: String(sortOrder) }
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
    console.error('Error fetching outgoing docs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch outgoing documents' });
  }
};

export const getOutgoingDocById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const doc = await prisma.outgoingDocument.findFirst({
      where: {
        OR: [{ id }, { documentId: id }],
        deletedAt: null,
      },
      include: {
        document: {
          include: {
            attachments: true,
            comments: {
              include: { user: { include: { employee: true } } },
              orderBy: { createdAt: 'desc' }
            },
            history: { orderBy: { createdAt: 'desc' } },
            workflowHistory: { orderBy: { stepOrder: 'asc' } },
            tasks: {
              include: {
                assignedTo: { include: { employee: true } },
                department: true,
              }
            }
          }
        },
        documentType: true,
        department: true,
      }
    });

    if (!doc) {
      res.status(404).json({ success: false, message: 'Outgoing document not found' });
      return;
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch outgoing document' });
  }
};

export const createOutgoingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      docNumber,
      docDate,
      recipientOrg,
      recipientName,
      subject,
      typeId,
      priority = 'NORMAL',
      departmentId,
      responsibleId,
      description,
      notes,
    } = req.body;

    let finalTypeId = typeId;
    if (!finalTypeId) {
      const firstType = await prisma.documentType.findFirst();
      finalTypeId = firstType?.id;
    }

    let finalDeptId = departmentId;
    if (!finalDeptId) {
      const firstDept = await prisma.department.findFirst();
      finalDeptId = firstDept?.id;
    }

    if (!subject || !recipientOrg || !finalDeptId || !finalTypeId) {
      res.status(400).json({ success: false, message: 'ກະລຸນາປ້ອນຂໍ້ມູນ: ຫົວຂໍ້ເອກະສານ ແລະ ໜ່ວຍງານຮັບ' });
      return;
    }

    // Generate unique outgoing number: ຂອ-YYYY/0001
    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.outgoingDocument.count();
    let num = countThisYear + 1;
    let outgoingNumber = '';
    while (true) {
      const candidate = `ຂອ-${currentYear}/${String(num).padStart(4, '0')}`;
      const exists = await prisma.outgoingDocument.findUnique({ where: { outgoingNumber: candidate } });
      if (!exists) {
        outgoingNumber = candidate;
        break;
      }
      num++;
    }

    // 1. Create parent Document
    const parentDoc = await prisma.document.create({
      data: {
        documentNumber: outgoingNumber,
        title: subject,
        typeId: finalTypeId,
        departmentId: finalDeptId,
        creatorId: req.user?.id,
        responsibleId: responsibleId || req.user?.id,
        priority,
        confidentiality: 'NORMAL',
        status: 'DRAFT',
        flowType: 'OUTGOING',
        description,
      }
    });

    // 2. Create OutgoingDocument
    const outgoingDoc = await prisma.outgoingDocument.create({
      data: {
        documentId: parentDoc.id,
        outgoingNumber,
        docNumber: docNumber || null,
        docDate: docDate ? new Date(docDate) : new Date(),
        recipientOrg,
        recipientName: recipientName || null,
        subject,
        typeId: finalTypeId,
        priority,
        departmentId: finalDeptId,
        responsibleId: responsibleId || req.user?.id,
        description: description || null,
        approvalStatus: 'DRAFT',
        notes: notes || null,
      },
      include: {
        documentType: true,
        department: true,
      }
    });

    // Handle file upload
    if (req.file) {
      await prisma.documentAttachment.create({
        data: {
          documentId: parentDoc.id,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          fileUrl: `/uploads/${req.file.filename}`,
          uploadedById: req.user?.id,
        }
      });
    }

    // Initial Workflow Step
    await prisma.workflowHistory.create({
      data: {
        documentId: parentDoc.id,
        stepOrder: 1,
        action: 'ສ້າງຮ່າງເອກະສານຂາອອກ',
        actorId: req.user?.id,
        actorName: req.user?.fullNameLao || req.user?.username || 'Staff',
        actorPosition: req.user?.roleNameLao,
        actorDepartment: req.user?.departmentId ? (await prisma.department.findUnique({ where: { id: req.user.departmentId } }))?.nameLao : '',
        comment: 'ສ້າງຮ່າງເອກະສານ ແລະ ສົ່ງເຂົ້າສູ່ຂັ້ນຕອນການກວດກາ',
        decision: 'FORWARD',
      }
    });

    // Record LHSE approval comments if provided
    let commentsObj: any = {};
    if (notes && typeof notes === 'string' && notes.trim().startsWith('{')) {
      try {
        commentsObj = JSON.parse(notes);
      } catch (e) {}
    }
    const cUnit = req.body.commentUnit || commentsObj.commentUnit;
    const cDeputyDept = req.body.commentDeputyDept || commentsObj.commentDeputyDept;
    const cDeptHead = req.body.commentDeptHead || commentsObj.commentDeptHead;
    const cDeputyDirector = req.body.commentDeputyDirector || commentsObj.commentDeputyDirector;
    const cDirector = req.body.commentDirector || commentsObj.commentDirector;

    let nextStepOrder = 2;
    if (cUnit) {
      await prisma.workflowHistory.create({
        data: {
          documentId: parentDoc.id,
          stepOrder: nextStepOrder++,
          action: 'ຄຳເຫັນຂອງຄະນະໜ່ວຍງານ',
          actorName: 'ຄະນະໜ່ວຍງານ',
          actorPosition: 'ຫົວໜ້າໜ່ວຍງານ',
          comment: cUnit,
          decision: 'APPROVE',
        }
      });
    }
    if (cDeputyDept) {
      await prisma.workflowHistory.create({
        data: {
          documentId: parentDoc.id,
          stepOrder: nextStepOrder++,
          action: 'ຄຳເຫັນຂອງຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ',
          actorName: 'ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ',
          actorPosition: 'ຮອງຫົວໜ້າພະແນກ',
          comment: cDeputyDept,
          decision: 'APPROVE',
        }
      });
    }
    if (cDeptHead) {
      await prisma.workflowHistory.create({
        data: {
          documentId: parentDoc.id,
          stepOrder: nextStepOrder++,
          action: 'ຄຳເຫັນຂອງຫົວໜ້າພະແນກ',
          actorName: 'ຫົວໜ້າພະແນກ',
          actorPosition: 'ຫົວໜ້າພະແນກ',
          comment: cDeptHead,
          decision: 'APPROVE',
        }
      });
    }
    if (cDeputyDirector) {
      await prisma.workflowHistory.create({
        data: {
          documentId: parentDoc.id,
          stepOrder: nextStepOrder++,
          action: 'ຄຳເຫັນຂອງ ຮອງ ຜອ',
          actorName: 'ຮອງຜູ້ອຳນວຍການ',
          actorPosition: 'ຮອງຜູ້ອຳນວຍການ',
          comment: cDeputyDirector,
        }
      });
    }
    if (cDirector) {
      await prisma.workflowHistory.create({
        data: {
          documentId: parentDoc.id,
          stepOrder: nextStepOrder++,
          action: 'ຄຳເຫັນຂອງ ຜອ',
          actorName: 'ຜູ້ອຳນວຍການ',
          actorPosition: 'ຜູ້ອຳນວຍການ',
          comment: cDirector,
          decision: 'APPROVE',
        }
      });
    }

    // Audit Log
    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'CREATE',
      module: 'DOCUMENT',
      recordId: parentDoc.id,
      description: `ສ້າງຮ່າງເອກະສານຂາອອກເລກທີ ${outgoingNumber} ເຖິງ ${recipientOrg}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'ສ້າງຮ່າງເອກະສານຂາອອກສຳເລັດແລ້ວ',
      data: outgoingDoc,
    });
  } catch (error: any) {
    console.error('Error creating outgoing doc:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create outgoing document' });
  }
};

export const updateOutgoingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      docNumber,
      docDate,
      recipientOrg,
      recipientName,
      subject,
      typeId,
      priority,
      departmentId,
      responsibleId,
      description,
      approvalStatus,
      sendingDate,
      notes,
    } = req.body;

    const existing = await prisma.outgoingDocument.findUnique({ where: { id }, include: { document: true } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Outgoing document not found' });
      return;
    }

    const updated = await prisma.outgoingDocument.update({
      where: { id },
      data: {
        docNumber,
        docDate: docDate ? new Date(docDate) : undefined,
        recipientOrg,
        recipientName,
        subject,
        typeId,
        priority,
        departmentId,
        responsibleId,
        description,
        approvalStatus,
        sendingDate: sendingDate ? new Date(sendingDate) : undefined,
        notes,
      },
      include: { documentType: true, department: true }
    });

    await prisma.document.update({
      where: { id: existing.documentId },
      data: {
        title: subject,
        priority,
        status: approvalStatus || existing.document.status,
        typeId,
        departmentId,
      }
    });

    if (req.file) {
      await prisma.documentAttachment.create({
        data: {
          documentId: existing.documentId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          fileUrl: `/uploads/${req.file.filename}`,
          uploadedById: req.user?.id,
        }
      });
    }

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'UPDATE',
      module: 'DOCUMENT',
      recordId: existing.documentId,
      description: `ແກ້ໄຂເອກະສານຂາອອກ ${existing.outgoingNumber}`,
      req,
    });

    res.json({ success: true, message: 'ແກ້ໄຂເອກະສານສຳເລັດ', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update outgoing document' });
  }
};

export const deleteOutgoingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.outgoingDocument.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    await prisma.outgoingDocument.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    await prisma.document.update({
      where: { id: existing.documentId },
      data: { deletedAt: new Date() }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'DELETE',
      module: 'DOCUMENT',
      recordId: existing.documentId,
      description: `ລຶບເອກະສານຂາອອກ ${existing.outgoingNumber}`,
      req,
    });

    res.json({ success: true, message: 'ລຶບເອກະສານຂາອອກສຳເລັດ' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete outgoing document' });
  }
};

export const approveOutgoingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment = 'ເຫັນດີ ແລະ ອະນຸມັດ' } = req.body;

    const doc = await prisma.outgoingDocument.findUnique({
      where: { id },
      include: { document: { include: { workflowHistory: true } } }
    });

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Determine next workflow step:
    // DRAFT -> REVIEW -> DEPT_APPROVAL -> MANAGEMENT_APPROVAL -> DIRECTOR_APPROVAL -> APPROVED -> SENT
    const flowOrder = [
      'DRAFT',
      'REVIEW',
      'DEPT_APPROVAL',
      'MANAGEMENT_APPROVAL',
      'DIRECTOR_APPROVAL',
      'APPROVED',
      'SENT',
    ];

    let currentIndex = flowOrder.indexOf(doc.approvalStatus);
    if (currentIndex === -1) currentIndex = 0;

    let nextStatus = flowOrder[Math.min(currentIndex + 1, flowOrder.length - 1)];

    // If Director or Super Admin approves, jump straight to APPROVED if past DEPT_APPROVAL
    if (req.user?.roleName === 'Director' || req.user?.roleName === 'Super Admin') {
      nextStatus = 'APPROVED';
    }

    // Update Outgoing Doc
    const updated = await prisma.outgoingDocument.update({
      where: { id },
      data: {
        approvalStatus: nextStatus,
        sendingDate: nextStatus === 'SENT' ? new Date() : undefined,
      }
    });

    await prisma.document.update({
      where: { id: doc.documentId },
      data: { status: nextStatus }
    });

    // Record in Workflow Timeline
    const stepCount = (doc.document.workflowHistory?.length || 0) + 1;
    await prisma.workflowHistory.create({
      data: {
        documentId: doc.documentId,
        stepOrder: stepCount,
        action: `ອະນຸມັດຂັ້ນຕອນ (${nextStatus})`,
        actorId: req.user?.id,
        actorName: req.user?.fullNameLao || 'Approver',
        actorPosition: req.user?.roleNameLao,
        comment,
        decision: 'APPROVE',
      }
    });

    // Audit Log
    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'APPROVE',
      module: 'DOCUMENT',
      recordId: doc.documentId,
      description: `ອະນຸມັດເອກະສານຂາອອກ ${doc.outgoingNumber} -> ${nextStatus}`,
      req,
    });

    // Notify document creator / responsible
    if (doc.responsibleId && doc.responsibleId !== req.user?.id) {
      await createNotification({
        userId: doc.responsibleId,
        title: 'ເອກະສານໄດ້ຮັບການອະນຸມັດ',
        message: `ເອກະສານເລກທີ ${doc.outgoingNumber} ໄດ້ຮັບການອະນຸມັດຂັ້ນຕອນ: ${nextStatus}`,
        type: 'SUCCESS',
        linkUrl: `/outgoing-docs?id=${doc.id}`,
      });
    }

    res.json({
      success: true,
      message: 'ອະນຸມັດເອກະສານສຳເລັດແລ້ວ',
      data: updated,
    });
  } catch (error) {
    console.error('Error approving document:', error);
    res.status(500).json({ success: false, message: 'Failed to approve document' });
  }
};

export const rejectOutgoingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, message: 'ກະລຸນາລະບຸເຫດຜົນໃນການປະຕິເສດ / ສົ່ງກັບຄືນ' });
      return;
    }

    const doc = await prisma.outgoingDocument.findUnique({
      where: { id },
      include: { document: { include: { workflowHistory: true } } }
    });

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Set status to REJECTED / Return to DRAFT
    const updated = await prisma.outgoingDocument.update({
      where: { id },
      data: { approvalStatus: 'REJECTED' }
    });

    await prisma.document.update({
      where: { id: doc.documentId },
      data: { status: 'REJECTED' }
    });

    // Workflow Timeline Step
    const stepCount = (doc.document.workflowHistory?.length || 0) + 1;
    await prisma.workflowHistory.create({
      data: {
        documentId: doc.documentId,
        stepOrder: stepCount,
        action: 'ປະຕິເສດ / ສົ່ງກັບຄືນແກ້ໄຂ',
        actorId: req.user?.id,
        actorName: req.user?.fullNameLao || 'Approver',
        actorPosition: req.user?.roleNameLao,
        comment: reason,
        decision: 'REJECT',
      }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'REJECT',
      module: 'DOCUMENT',
      recordId: doc.documentId,
      description: `ປະຕິເສດເອກະສານຂາອອກ ${doc.outgoingNumber}: ${reason}`,
      req,
    });

    // Notify creator
    if (doc.responsibleId) {
      await createNotification({
        userId: doc.responsibleId,
        title: 'ເອກະສານຖືກສົ່ງກັບຄືນແກ້ໄຂ',
        message: `ເອກະສານ ${doc.outgoingNumber} ຖືກສົ່ງກັບຄືນ. ເຫດຜົນ: ${reason}`,
        type: 'WARNING',
        linkUrl: `/outgoing-docs?id=${doc.id}`,
      });
    }

    res.json({
      success: true,
      message: 'ສົ່ງກັບຄືນເອກະສານຮຽບຮ້ອຍແລ້ວ',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject document' });
  }
};
