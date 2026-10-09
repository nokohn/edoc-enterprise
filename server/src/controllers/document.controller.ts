import { Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { logAudit } from '../services/audit.service.js';

export const getAllDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      flowType,
      departmentId,
      status,
      priority,
      typeId,
      page = 1,
      limit = 20,
    } = req.query;

    const where: any = { deletedAt: null };

    if (flowType) where.flowType = String(flowType);
    if (departmentId) where.departmentId = String(departmentId);
    if (status) where.status = String(status);
    if (priority) where.priority = String(priority);
    if (typeId) where.typeId = String(typeId);

    if (search) {
      const q = String(search);
      where.OR = [
        { documentNumber: { contains: q } },
        { title: { contains: q } },
        { incomingDetails: { senderOrg: { contains: q } } },
        { outgoingDetails: { recipientOrg: { contains: q } } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, items] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        include: {
          documentType: true,
          department: true,
          incomingDetails: true,
          outgoingDetails: true,
          attachments: true,
          _count: {
            select: {
              comments: true,
              tasks: true,
              attachments: true,
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
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
    console.error('Error fetching all documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const doc = await prisma.document.findFirst({
      where: {
        OR: [{ id }, { documentNumber: id }],
        deletedAt: null,
      },
      include: {
        documentType: true,
        department: true,
        incomingDetails: true,
        outgoingDetails: true,
        attachments: true,
        comments: {
          include: {
            user: { include: { employee: true } }
          },
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
    });

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    res.json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
};

export const addDocumentComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, isInternal = false } = req.body;

    if (!content) {
      res.status(400).json({ success: false, message: 'Comment content is required' });
      return;
    }

    const comment = await prisma.documentComment.create({
      data: {
        documentId: id,
        userId: req.user?.id || '',
        content,
        isInternal: Boolean(isInternal),
      },
      include: {
        user: { include: { employee: true } }
      }
    });

    res.status(201).json({ success: true, message: 'ເພີ່ມຄຳເຫັນສຳເລັດ', data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

export const uploadDocumentAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const attachment = await prisma.documentAttachment.create({
      data: {
        documentId: id,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        fileUrl: `/uploads/${req.file.filename}`,
        uploadedById: req.user?.id,
      }
    });

    await logAudit({
      userId: req.user?.id,
      userName: req.user?.fullNameLao,
      action: 'CREATE',
      module: 'DOCUMENT',
      recordId: id,
      description: `ອັບໂຫຼດໄຟລ໌ຄັດຕິດ: ${req.file.originalname}`,
      req,
    });

    res.status(201).json({ success: true, message: 'ອັບໂຫຼດໄຟລ໌ສຳເລັດ', data: attachment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload attachment' });
  }
};

export const getDocumentTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const types = await prisma.documentType.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch document types' });
  }
};
