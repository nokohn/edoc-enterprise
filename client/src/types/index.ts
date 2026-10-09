export interface User {
  id: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  roleId: string;
  departmentId?: string | null;
  positionId?: string | null;
  employeeId?: string | null;
  isActive: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  fullNameLao?: string | null;
  fullNameEn?: string | null;
  roleName?: string | null;
  roleNameLao?: string | null;
  departmentName?: string | null;
  role?: Role;
  department?: Department;
  position?: Position;
  employee?: Employee;
  permissions?: string[];
}

export interface Role {
  id: string;
  name: string;
  nameLao: string;
  description?: string | null;
  isSystem?: boolean;
  rolePermissions?: {
    permission: Permission;
  }[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  nameLao: string;
  module: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  nameLao: string;
  description?: string | null;
  headId?: string | null;
  deputyHeadId?: string | null;
  parentId?: string | null;
  isActive: boolean;
  head?: User | null;
  deputyHead?: User | null;
  subDepts?: Department[];
  _count?: {
    users?: number;
    employees?: number;
    documents?: number;
    tasks?: number;
  };
}

export interface Position {
  id: string;
  code: string;
  name: string;
  nameLao: string;
  level: number;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullNameLao: string;
  fullNameEn?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  roleId?: string | null;
  avatarUrl?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  department?: Department;
  position?: Position;
  role?: Role;
  user?: User;
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  nameLao: string;
  prefix?: string | null;
}

export interface DocumentAttachment {
  id: string;
  documentId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedById?: string | null;
  createdAt: string;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user?: User;
}

export interface DocumentHistory {
  id: string;
  documentId: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  statusBefore?: string | null;
  statusAfter?: string | null;
  comment?: string | null;
  createdAt: string;
}

export interface WorkflowHistory {
  id: string;
  documentId?: string | null;
  taskId?: string | null;
  stepOrder: number;
  action: string;
  actorId?: string | null;
  actorName: string;
  actorPosition?: string | null;
  actorDepartment?: string | null;
  comment?: string | null;
  decision?: string | null;
  createdAt: string;
}

export interface IncomingDocument {
  id: string;
  documentId: string;
  incomingNumber: string;
  originalDocNumber?: string | null;
  docDate?: string | null;
  receivedDate: string;
  receivedTime?: string | null;
  senderOrg: string;
  senderName?: string | null;
  subject: string;
  typeId: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'URGENTEST';
  confidentialLevel: 'NORMAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  departmentId: string;
  responsibleId?: string | null;
  description?: string | null;
  status: 'NEW' | 'REGISTERED' | 'REVIEWING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  dueDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  document?: Document;
  documentType?: DocumentType;
  department?: Department;
}

export interface OutgoingDocument {
  id: string;
  documentId: string;
  outgoingNumber: string;
  docNumber?: string | null;
  docDate: string;
  recipientOrg: string;
  recipientName?: string | null;
  subject: string;
  typeId: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'URGENTEST';
  departmentId: string;
  responsibleId?: string | null;
  description?: string | null;
  approvalStatus: 'DRAFT' | 'REVIEW' | 'DEPT_APPROVAL' | 'MANAGEMENT_APPROVAL' | 'DIRECTOR_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SENT' | 'ARCHIVED';
  sendingDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  document?: Document;
  documentType?: DocumentType;
  department?: Department;
}

export interface Document {
  id: string;
  documentNumber: string;
  title: string;
  typeId: string;
  departmentId: string;
  creatorId?: string | null;
  responsibleId?: string | null;
  priority: string;
  confidentiality: string;
  status: string;
  flowType: 'INCOMING' | 'OUTGOING' | 'INTERNAL';
  description?: string | null;
  metadataJson?: string | null;
  createdAt: string;
  updatedAt: string;
  documentType?: DocumentType;
  department?: Department;
  incomingDetails?: IncomingDocument | null;
  outgoingDetails?: OutgoingDocument | null;
  attachments?: DocumentAttachment[];
  comments?: DocumentComment[];
  history?: DocumentHistory[];
  tasks?: Task[];
  workflowHistory?: WorkflowHistory[];
  _count?: {
    comments?: number;
    tasks?: number;
    attachments?: number;
  };
}

export interface Task {
  id: string;
  taskCode: string;
  title: string;
  documentId?: string | null;
  assignedById: string;
  assignedToId: string;
  departmentId: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  startDate: string;
  dueDate?: string | null;
  completionDate?: string | null;
  description?: string | null;
  status: 'NEW' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'WAITING' | 'SUBMITTED' | 'REVIEW' | 'REVIEWING' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'OVERDUE';
  progress: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  document?: Document | null;
  assignedBy?: User;
  assignedTo?: User;
  department?: Department;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  history?: TaskHistory[];
  workflowHistory?: WorkflowHistory[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: User;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedById?: string | null;
  createdAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  statusBefore?: string | null;
  statusAfter?: string | null;
  progressBefore?: number | null;
  progressAfter?: number | null;
  comment?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'APPROVAL';
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  eventType: 'MEETING' | 'TASK_DUE' | 'DOC_DEADLINE' | 'APPROVAL' | 'HOLIDAY' | 'EVENT';
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string | null;
  color?: string | null;
  documentId?: string | null;
  taskId?: string | null;
  departmentId?: string | null;
  createdById?: string | null;
  department?: Department | null;
  document?: Document | null;
  task?: Task | null;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  description: string;
  detailsJson?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  counts: {
    incomingDocs: number;
    outgoingDocs: number;
    assignedTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    pendingTasks: number;
    pendingApprovals: number;
  };
  charts: {
    incomingByMonth: { month: string; count: number }[];
    outgoingByMonth: { month: string; count: number }[];
    tasksByStatus: { status: string; count: number; color: string }[];
    tasksByDept: { dept: string; count: number }[];
    workflowStats: { stage: string; count: number }[];
    employeeWorkload: { name: string; tasks: number }[];
    overdueTasks: { id: string; title: string; due: string; dept: string }[];
  };
  recent: {
    documents: Document[];
    tasks: Task[];
    approvals: any[];
    completedTasks: Task[];
  };
}
