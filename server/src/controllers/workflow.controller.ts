import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';

// Default LHSE 5-Step Approval Hierarchy matching the official Routing Slip:
// 1. ຜູ້ຄົ້ນຄວ້າ / ສ້າງຮ່າງ (Staff / Officer)
// 2. ຄຳເຫັນຂອງຄະນະໜ່ວຍງານ (Unit Committee / Unit Head)
// 3. ຄຳເຫັນຂອງຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ (Deputy Department Head)
// 4. ຄຳເຫັນຂອງຫົວໜ້າພະແນກ (Department Head)
// 5. ຄຳເຫັນຂອງ ຮອງ ຜອ (Deputy Director)
// 6. ຄຳເຫັນຂອງ ຜອ (Director)
const DEFAULT_LHSE_STEPS = [
  { stepOrder: 1, title: 'ຜູ້ຄົ້ນຄວ້າ / ສ້າງຮ່າງ', roleName: 'Officer / Staff' },
  { stepOrder: 2, title: 'ຄຳເຫັນຂອງຄະນະໜ່ວຍງານ', roleName: 'Unit Head' },
  { stepOrder: 3, title: 'ຄຳເຫັນຂອງຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ', roleName: 'Deputy Department Head' },
  { stepOrder: 4, title: 'ຄຳເຫັນຂອງຫົວໜ້າພະແນກ', roleName: 'Department Head' },
  { stepOrder: 5, title: 'ຄຳເຫັນຂອງ ຮອງ ຜອ', roleName: 'Deputy Director' },
  { stepOrder: 6, title: 'ຄຳເຫັນຂອງ ຜອ', roleName: 'Director' },
];

export const getWorkflowSteps = async (req: Request, res: Response): Promise<void> => {
  try {
    let steps = await prisma.workflowStep.findMany({
      orderBy: { stepOrder: 'asc' },
    });

    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    // If steps don't exist or need sync with LHSE structure
    if (steps.length === 0) {
      for (const s of DEFAULT_LHSE_STEPS) {
        const matchingRole = roles.find(r => r.name === s.roleName);
        await prisma.workflowStep.create({
          data: {
            workflowType: 'APPROVAL',
            title: s.title,
            stepOrder: s.stepOrder,
            approverRoleId: matchingRole?.id || null,
            isMandatory: true,
          }
        });
      }
      steps = await prisma.workflowStep.findMany({
        orderBy: { stepOrder: 'asc' },
      });
    }

    // Attach role objects for ease of use in UI
    const stepsWithRoles = steps.map(step => {
      const role = roles.find(r => r.id === step.approverRoleId);
      return {
        ...step,
        role: role || null,
      };
    });

    res.json({
      success: true,
      data: stepsWithRoles,
      roles,
    });
  } catch (error) {
    console.error('Error fetching workflow steps:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workflow steps' });
  }
};

export const updateWorkflowStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, stepOrder, approverRoleId, isMandatory } = req.body;

    const updated = await prisma.workflowStep.update({
      where: { id },
      data: {
        title,
        stepOrder: stepOrder ? Number(stepOrder) : undefined,
        approverRoleId,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : undefined,
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'UPDATE',
      module: 'WORKFLOW',
      recordId: id,
      description: `ປັບປຸງຂັ້ນຕອນການອະນຸມັດ: ${updated.title} (ລຳດັບ ${updated.stepOrder})`,
      req,
    });

    res.json({
      success: true,
      message: 'ປັບປຸງຂັ້ນຕອນອະນຸມັດສຳເລັດ',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating workflow step:', error);
    res.status(500).json({ success: false, message: 'Failed to update workflow step' });
  }
};

export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, departmentId, priority, status } = req.query;

    // 1. Pending Outgoing Documents
    const outgoingWhere: any = {
      deletedAt: null,
      approvalStatus: {
        in: status 
          ? [String(status)]
          : ['DRAFT', 'REVIEW', 'DEPT_APPROVAL', 'MANAGEMENT_APPROVAL', 'DIRECTOR_APPROVAL'],
      },
    };

    if (departmentId) outgoingWhere.departmentId = String(departmentId);
    if (priority) outgoingWhere.priority = String(priority);

    const outgoingDocs = await prisma.outgoingDocument.findMany({
      where: outgoingWhere,
      include: {
        document: {
          include: {
            attachments: true,
            workflowHistory: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        department: true,
        documentType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Incoming Documents that require action / directives
    const incomingWhere: any = {
      deletedAt: null,
      status: {
        in: ['NEW', 'IN_PROGRESS', 'PENDING'],
      },
    };

    if (departmentId) incomingWhere.departmentId = String(departmentId);
    if (priority) incomingWhere.priority = String(priority);

    const incomingDocs = await prisma.incomingDocument.findMany({
      where: incomingWhere,
      include: {
        document: {
          include: {
            attachments: true,
            workflowHistory: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        department: true,
        documentType: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Stats
    const stats = {
      totalPending: outgoingDocs.length,
      incomingPending: incomingDocs.length,
      draftCount: outgoingDocs.filter(d => d.approvalStatus === 'DRAFT').length,
      unitReviewCount: outgoingDocs.filter(d => d.approvalStatus === 'REVIEW').length,
      deptApprovalCount: outgoingDocs.filter(d => d.approvalStatus === 'DEPT_APPROVAL').length,
      managementCount: outgoingDocs.filter(d => d.approvalStatus === 'MANAGEMENT_APPROVAL').length,
      directorApprovalCount: outgoingDocs.filter(d => d.approvalStatus === 'DIRECTOR_APPROVAL').length,
      urgentCount: outgoingDocs.filter(d => d.priority === 'URGENT').length,
    };

    res.json({
      success: true,
      data: {
        outgoing: outgoingDocs,
        incoming: incomingDocs,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' });
  }
};

export const getWorkflowHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50 } = req.query;

    const history = await prisma.workflowHistory.findMany({
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        document: true,
      },
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workflow history' });
  }
};

export const approveDocumentStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment = 'ເຫັນດີ ແລະ ອະນຸມັດ', stepName, signatureDataUrl } = req.body;

    const doc = await prisma.outgoingDocument.findUnique({
      where: { id },
      include: {
        document: {
          include: { workflowHistory: true },
        },
      },
    });

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

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

    // If Director or Super Admin approves, jump straight to APPROVED
    if (req.user?.roleName === 'Director' || req.user?.roleName === 'Super Admin') {
      nextStatus = 'APPROVED';
    }

    // Update LHSE slip notes if signatureDataUrl or comment provided
    let rawNotes = doc.notes || '';
    let parsedNotes: any = {};
    try {
      if (rawNotes.trim().startsWith('{')) {
        parsedNotes = JSON.parse(rawNotes);
      }
    } catch (e) {}

    const actorName = req.user?.fullNameLao || req.user?.username || 'Approver';
    const todayStr = new Date().toISOString().split('T')[0];

    // Map current approval stage to appropriate LHSE signature field
    if (doc.approvalStatus === 'DRAFT' || doc.approvalStatus === 'REVIEW') {
      if (signatureDataUrl) parsedNotes.signImageUnit = signatureDataUrl;
      parsedNotes.commentUnit = comment;
      parsedNotes.signUnit = actorName;
      parsedNotes.dateUnit = todayStr;
    } else if (doc.approvalStatus === 'DEPT_APPROVAL') {
      if (signatureDataUrl) parsedNotes.signImageDeputyDept = signatureDataUrl;
      parsedNotes.commentDeputyDept = comment;
      parsedNotes.signDeputyDept = actorName;
      parsedNotes.dateDeputyDept = todayStr;
    } else if (doc.approvalStatus === 'MANAGEMENT_APPROVAL') {
      if (signatureDataUrl) parsedNotes.signImageDeptHead = signatureDataUrl;
      parsedNotes.commentDeptHead = comment;
      parsedNotes.signDeptHead = actorName;
      parsedNotes.dateDeptHead = todayStr;
    } else if (doc.approvalStatus === 'DIRECTOR_APPROVAL') {
      if (signatureDataUrl) parsedNotes.signImageDirector = signatureDataUrl;
      parsedNotes.commentDirector = comment;
      parsedNotes.signDirector = actorName;
      parsedNotes.dateDirector = todayStr;
    }

    const updatedNotesJson = JSON.stringify(parsedNotes);

    const updated = await prisma.outgoingDocument.update({
      where: { id },
      data: {
        approvalStatus: nextStatus,
        notes: updatedNotesJson,
        sendingDate: nextStatus === 'SENT' ? new Date() : undefined,
      },
    });

    await prisma.document.update({
      where: { id: doc.documentId },
      data: { status: nextStatus },
    });

    const stepCount = (doc.document.workflowHistory?.length || 0) + 1;
    await prisma.workflowHistory.create({
      data: {
        documentId: doc.documentId,
        stepOrder: stepCount,
        action: stepName || `ອະນຸມັດຂັ້ນຕອນ (${nextStatus})`,
        actorId: req.user?.id,
        actorName: req.user?.fullNameLao || req.user?.username || 'Approver',
        actorPosition: req.user?.roleNameLao || req.user?.roleName,
        comment,
        decision: 'APPROVE',
      },
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'APPROVE',
      module: 'WORKFLOW',
      recordId: doc.documentId,
      description: `ອະນຸມັດເອກະສານຂາອອກ ${doc.outgoingNumber} -> ${nextStatus}`,
      req,
    });

    if (doc.responsibleId && doc.responsibleId !== req.user?.id) {
      await createNotification({
        userId: doc.responsibleId,
        title: 'ເອກະສານໄດ້ຮັບການອະນຸມັດ',
        message: `ເອກະສານເລກທີ ${doc.outgoingNumber} ໄດ້ຮັບການອະນຸມັດຂັ້ນຕອນ: ${nextStatus}`,
        type: 'SUCCESS',
        linkUrl: `/approval-workflow?id=${doc.id}`,
      });
    }

    res.json({
      success: true,
      message: 'ອະນຸມັດຂັ້ນຕອນສຳເລັດແລ້ວ',
      data: updated,
    });
  } catch (error) {
    console.error('Error approving document step:', error);
    res.status(500).json({ success: false, message: 'Failed to approve document step' });
  }
};
