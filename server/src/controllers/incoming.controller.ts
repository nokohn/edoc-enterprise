import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';

export const getIncomingDocs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      departmentId,
      status,
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
    if (status && status !== 'undefined' && status !== '') {
      where.status = String(status);
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
        { incomingNumber: { contains: q } },
        { originalDocNumber: { contains: q } },
        { subject: { contains: q } },
        { senderOrg: { contains: q } },
        { senderName: { contains: q } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, items] = await Promise.all([
      prisma.incomingDocument.count({ where }),
      prisma.incomingDocument.findMany({
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
  } catch (error: any) {
    console.error('Error fetching incoming docs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch incoming documents' });
  }
};

export const getIncomingDocById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const doc = await prisma.incomingDocument.findFirst({
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
      res.status(404).json({ success: false, message: 'Incoming document not found' });
      return;
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch incoming document' });
  }
};

export const createIncomingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      originalDocNumber,
      docDate,
      receivedDate,
      receivedTime,
      senderOrg,
      senderName,
      subject,
      typeId,
      priority = 'NORMAL',
      confidentialLevel = 'NORMAL',
      departmentId,
      responsibleId,
      description,
      dueDate,
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

    if (!subject || !senderOrg || !finalDeptId || !finalTypeId) {
      res.status(400).json({ success: false, message: 'ກະລຸນາປ້ອນຂໍ້ມູນ: ຫົວຂໍ້ເອກະສານ ແລະ ໜ່ວຍງານສົ່ງ' });
      return;
    }

    // Generate unique incoming number: ຂຂ-YYYY/0001
    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.incomingDocument.count();
    let num = countThisYear + 1;
    let incomingNumber = '';
    while (true) {
      const candidate = `ຂຂ-${currentYear}/${String(num).padStart(4, '0')}`;
      const exists = await prisma.incomingDocument.findUnique({ where: { incomingNumber: candidate } });
      if (!exists) {
        incomingNumber = candidate;
        break;
      }
      num++;
    }

    // 1. Create parent Document
    const parentDoc = await prisma.document.create({
      data: {
        documentNumber: incomingNumber,
        title: subject,
        typeId: finalTypeId,
        departmentId: finalDeptId,
        creatorId: req.user?.id,
        responsibleId: responsibleId || null,
        priority,
        confidentiality: confidentialLevel,
        status: 'NEW',
        flowType: 'INCOMING',
        description,
      }
    });

    // 2. Create IncomingDocument
    const incomingDoc = await prisma.incomingDocument.create({
      data: {
        documentId: parentDoc.id,
        incomingNumber,
        originalDocNumber: originalDocNumber || null,
        docDate: docDate ? new Date(docDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        receivedTime: receivedTime || new Date().toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }),
        senderOrg,
        senderName: senderName || null,
        subject,
        typeId: finalTypeId,
        priority,
        confidentialLevel,
        departmentId: finalDeptId,
        responsibleId: responsibleId || null,
        description: description || null,
        status: 'NEW',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
      include: {
        documentType: true,
        department: true,
      }
    });

    // Handle file upload if provided
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

    // Add Initial Workflow History
    await prisma.workflowHistory.create({
      data: {
        documentId: parentDoc.id,
        stepOrder: 1,
        action: 'ລົງທະບຽນເອກະສານຂາເຂົ້າ',
        actorId: req.user?.id,
        actorName: req.user?.fullNameLao || req.user?.username || 'Admin',
        actorPosition: req.user?.roleNameLao,
        comment: 'ລົງທະບຽນເອກະສານເຂົ້າສູ່ລະບົບ',
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
      description: `ລົງທະບຽນເອກະສານຂາເຂົ້າເລກທີ ${incomingNumber} ຈາກ ${senderOrg}`,
      req,
    });

    // Notify Department Head if assigned
    const targetDept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (targetDept?.headId) {
      await createNotification({
        userId: targetDept.headId,
        title: 'ເອກະສານຂາເຂົ້າໃໝ່',
        message: `ມີເອກະສານຂາເຂົ້າໃໝ່: ${incomingNumber} - ${subject}`,
        type: priority === 'URGENT' || priority === 'URGENTEST' ? 'URGENT' : 'INFO',
        linkUrl: `/incoming-docs?id=${incomingDoc.id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'ລົງທະບຽນເອກະສານຂາເຂົ້າສຳເລັດແລ້ວ',
      data: incomingDoc,
    });
  } catch (error: any) {
    console.error('Error creating incoming document:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create incoming document' });
  }
};

export const updateIncomingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      originalDocNumber,
      docDate,
      receivedDate,
      receivedTime,
      senderOrg,
      senderName,
      subject,
      typeId,
      priority,
      confidentialLevel,
      departmentId,
      responsibleId,
      description,
      status,
      dueDate,
      notes,
    } = req.body;

    const existing = await prisma.incomingDocument.findUnique({ where: { id }, include: { document: true } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Incoming document not found' });
      return;
    }

    const updated = await prisma.incomingDocument.update({
      where: { id },
      data: {
        originalDocNumber,
        docDate: docDate ? new Date(docDate) : undefined,
        receivedDate: receivedDate ? new Date(receivedDate) : undefined,
        receivedTime,
        senderOrg,
        senderName,
        subject,
        typeId,
        priority,
        confidentialLevel,
        departmentId,
        responsibleId,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
      },
      include: { documentType: true, department: true }
    });

    // Update parent Document
    await prisma.document.update({
      where: { id: existing.documentId },
      data: {
        title: subject,
        priority,
        confidentiality: confidentialLevel,
        status: status || existing.document.status,
        typeId,
        departmentId,
      }
    });

    // Handle file upload if added
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

    // Document History
    await prisma.documentHistory.create({
      data: {
        documentId: existing.documentId,
        userId: req.user?.id,
        userName: req.user?.fullNameLao,
        action: 'ແກ້ໄຂເອກະສານ',
        statusBefore: existing.status,
        statusAfter: status || existing.status,
        comment: 'ປັບປຸງຂໍ້ມູນເອກະສານຂາເຂົ້າ',
      }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'UPDATE',
      module: 'DOCUMENT',
      recordId: existing.documentId,
      description: `ແກ້ໄຂເອກະສານຂາເຂົ້າ ${existing.incomingNumber}`,
      req,
    });

    res.json({ success: true, message: 'ແກ້ໄຂຂໍ້ມູນເອກະສານສຳເລັດ', data: updated });
  } catch (error) {
    console.error('Error updating incoming doc:', error);
    res.status(500).json({ success: false, message: 'Failed to update incoming document' });
  }
};

export const deleteIncomingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.incomingDocument.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    await prisma.incomingDocument.update({
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
      description: `ລຶບເອກະສານຂາເຂົ້າ ${existing.incomingNumber}`,
      req,
    });

    res.json({ success: true, message: 'ລຶບເອກະສານຂາເຂົ້າສຳເລັດແລ້ວ' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete incoming document' });
  }
};

export const assignIncomingDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedToId, departmentId, instructions, priority = 'NORMAL', dueDate } = req.body;

    const doc = await prisma.incomingDocument.findUnique({
      where: { id },
      include: { document: true }
    });

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // 1. Create a linked Task
    const taskCount = await prisma.task.count();
    const taskCode = `TSK-${new Date().getFullYear()}-${String(taskCount + 1).padStart(3, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskCode,
        title: `ດຳເນີນການຕາມເອກະສານ: ${doc.incomingNumber} - ${doc.subject}`,
        documentId: doc.documentId,
        assignedById: req.user?.id || '',
        assignedToId,
        departmentId: departmentId || doc.departmentId,
        priority,
        status: 'ASSIGNED',
        progress: 0,
        description: instructions || doc.description,
        startDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : doc.dueDate,
      }
    });

    // 2. Update incoming doc status
    await prisma.incomingDocument.update({
      where: { id },
      data: { status: 'ASSIGNED', responsibleId: assignedToId }
    });
    await prisma.document.update({
      where: { id: doc.documentId },
      data: { status: 'ASSIGNED', responsibleId: assignedToId }
    });

    // 3. Workflow timeline step
    const targetUser = await prisma.user.findUnique({
      where: { id: assignedToId },
      include: { employee: true, role: true }
    });

    await prisma.workflowHistory.create({
      data: {
        documentId: doc.documentId,
        taskId: task.id,
        stepOrder: 3,
        action: 'ມອບໝາຍວຽກງານ',
        actorId: req.user?.id,
        actorName: req.user?.fullNameLao || 'Director',
        actorPosition: req.user?.roleNameLao,
        comment: `ມອບໝາຍໃຫ້ ${targetUser?.employee?.fullNameLao || targetUser?.username}: ${instructions || ''}`,
        decision: 'FORWARD',
      }
    });

    // 4. Notify assignee
    await createNotification({
      userId: assignedToId,
      title: 'ທ່ານໄດ້ຮັບການມອບໝາຍວຽກໃໝ່',
      message: `ວຽກ: ${task.title}. ຄຳແນະນຳ: ${instructions || 'ກະລຸນາດຳເນີນການ'}`,
      type: 'URGENT',
      linkUrl: `/task-tracking?id=${task.id}`,
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'ASSIGN',
      module: 'DOCUMENT',
      recordId: doc.documentId,
      description: `ມອບໝາຍເອກະສານ ${doc.incomingNumber} ໃຫ້ ${targetUser?.employee?.fullNameLao || targetUser?.username}`,
      req,
    });

    res.json({
      success: true,
      message: 'ມອບໝາຍວຽກງານສຳເລັດແລ້ວ',
      data: { task, incomingDoc: doc }
    });
  } catch (error) {
    console.error('Error assigning incoming doc:', error);
    res.status(500).json({ success: false, message: 'Failed to assign document' });
  }
};
