import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  FileEdit,
  Send,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
  Archive,
  Hourglass,
  Sparkles,
  UserCheck,
  CheckSquare,
  Eye,
  Calendar,
  XCircle,
  Ban,
  ListTodo,
  Activity,
  Tag,
} from 'lucide-react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
}) => {
  const variants = {
    default: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full border shadow-2xs transition-colors',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
    </span>
  );
};

export interface StatusBadgeProps {
  status?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md' }) => {
  const raw = (status || '').trim();
  const normalized = raw.toUpperCase();
  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  // Standard status keys
  switch (normalized) {
    case 'NEW':
      return (
        <Badge variant="info" size={size} icon={<Sparkles className={clsx(iconClass, 'text-sky-600')} />} className={className}>
          ໃໝ່ (New)
        </Badge>
      );
    case 'REGISTERED':
      return (
        <Badge variant="default" size={size} icon={<FileText className={clsx(iconClass, 'text-blue-600')} />} className={className}>
          ລົງທະບຽນແລ້ວ (Registered)
        </Badge>
      );
    case 'DRAFT':
      return (
        <Badge variant="gray" size={size} icon={<FileEdit className={clsx(iconClass, 'text-slate-500')} />} className={className}>
          ຮ່າງເອກະສານ (Draft)
        </Badge>
      );
    case 'REVIEWING':
    case 'REVIEW':
      return (
        <Badge variant="purple" size={size} icon={<Eye className={clsx(iconClass, 'text-purple-600 animate-pulse')} />} className={className}>
          ກຳລັງກວດກາ (Reviewing)
        </Badge>
      );
    case 'ASSIGNED':
      return (
        <Badge variant="info" size={size} icon={<UserCheck className={clsx(iconClass, 'text-sky-600')} />} className={className}>
          ມອບໝາຍແລ້ວ (Assigned)
        </Badge>
      );
    case 'ACCEPTED':
      return (
        <Badge variant="info" size={size} icon={<CheckSquare className={clsx(iconClass, 'text-sky-600')} />} className={className}>
          ຮັບວຽກແລ້ວ (Accepted)
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="warning" size={size} icon={<Clock className={clsx(iconClass, 'text-amber-600 animate-pulse')} />} className={className}>
          ກຳລັງດຳເນີນການ (In Progress)
        </Badge>
      );
    case 'WAITING':
      return (
        <Badge variant="warning" size={size} icon={<Hourglass className={clsx(iconClass, 'text-amber-600 animate-pulse')} />} className={className}>
          ລໍຖ້າ (Waiting)
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="warning" size={size} icon={<Clock className={clsx(iconClass, 'text-amber-600')} />} className={className}>
          ລໍຖ້າ (Pending)
        </Badge>
      );
    case 'SUBMITTED':
      return (
        <Badge variant="info" size={size} icon={<Send className={clsx(iconClass, 'text-sky-600')} />} className={className}>
          ສົ່ງແລ້ວ (Submitted)
        </Badge>
      );
    case 'DEPT_APPROVAL':
      return (
        <Badge variant="warning" size={size} icon={<UserCheck className={clsx(iconClass, 'text-amber-600')} />} className={className}>
          ລໍຖ້າຮອງພະແນກ (Dept Approval)
        </Badge>
      );
    case 'MANAGEMENT_APPROVAL':
      return (
        <Badge variant="purple" size={size} icon={<ShieldCheck className={clsx(iconClass, 'text-indigo-600')} />} className={className}>
          ລໍຖ້າຫົວໜ້າພະແນກ (Management Approval)
        </Badge>
      );
    case 'DIRECTOR_APPROVAL':
      return (
        <Badge variant="purple" size={size} icon={<Award className={clsx(iconClass, 'text-purple-600')} />} className={className}>
          ລໍຖ້າຄະນະ ຜອ (Director Approval)
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="success" size={size} icon={<CheckCircle2 className={clsx(iconClass, 'text-emerald-600')} />} className={className}>
          ອະນຸມັດແລ້ວ (Approved)
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="success" size={size} icon={<CheckCircle className={clsx(iconClass, 'text-emerald-600')} />} className={className}>
          ສຳເລັດສົມບູນ (Completed)
        </Badge>
      );
    case 'SENT':
      return (
        <Badge variant="success" size={size} icon={<Send className={clsx(iconClass, 'text-teal-600')} />} className={className}>
          ສົ່ງອອກແລ້ວ (Sent)
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="danger" size={size} icon={<XCircle className={clsx(iconClass, 'text-red-600')} />} className={className}>
          ສົ່ງກັບຄືນ / ປະຕິເສດ (Rejected)
        </Badge>
      );
    case 'CANCELLED':
    case 'CANCELED':
      return (
        <Badge variant="danger" size={size} icon={<Ban className={clsx(iconClass, 'text-red-600')} />} className={className}>
          ຍົກເລີກ (Cancelled)
        </Badge>
      );
    case 'ARCHIVED':
      return (
        <Badge variant="gray" size={size} icon={<Archive className={clsx(iconClass, 'text-slate-500')} />} className={className}>
          ຈັດເກັບແລ້ວ (Archived)
        </Badge>
      );
    case 'OVERDUE':
      return (
        <Badge variant="danger" size={size} icon={<AlertTriangle className={clsx(iconClass, 'text-red-600 animate-pulse')} />} className={className}>
          ກາຍກຳນົດ (Overdue)
        </Badge>
      );
    case 'TODO':
      return (
        <Badge variant="gray" size={size} icon={<ListTodo className={clsx(iconClass, 'text-slate-500')} />} className={className}>
          ລໍຖ້າເລີ່ມ (To Do)
        </Badge>
      );
    case 'ACTIVE':
      return (
        <Badge variant="success" size={size} icon={<CheckCircle2 className={clsx(iconClass, 'text-emerald-600')} />} className={className}>
          ເປີດໃຊ້ງານ (Active)
        </Badge>
      );
    case 'INACTIVE':
      return (
        <Badge variant="danger" size={size} icon={<XCircle className={clsx(iconClass, 'text-red-600')} />} className={className}>
          ລະງັບ / ປິດໃຊ້ງານ (Inactive)
        </Badge>
      );
    case 'ON_LEAVE':
      return (
        <Badge variant="warning" size={size} icon={<Calendar className={clsx(iconClass, 'text-amber-600')} />} className={className}>
          ລາພັກ (On Leave)
        </Badge>
      );
    default:
      break;
  }

  // Handle direct Lao string matches
  if (raw === 'ເປີດໃຊ້ງານ') {
    return (
      <Badge variant="success" size={size} icon={<CheckCircle2 className={clsx(iconClass, 'text-emerald-600')} />} className={className}>
        ເປີດໃຊ້ງານ
      </Badge>
    );
  }
  if (raw === 'ລະງັບ' || raw === 'ປິດໃຊ້ງານ') {
    return (
      <Badge variant="danger" size={size} icon={<XCircle className={clsx(iconClass, 'text-red-600')} />} className={className}>
        ລະງັບ
      </Badge>
    );
  }
  if (raw === 'ສຳເລັດ' || raw === 'ສຳເລັດສົມບູນ') {
    return (
      <Badge variant="success" size={size} icon={<CheckCircle className={clsx(iconClass, 'text-emerald-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ກຳລັງດຳເນີນ' || raw === 'ກຳລັງດຳເນີນການ' || raw === 'ດຳເນີນ') {
    return (
      <Badge variant="warning" size={size} icon={<Clock className={clsx(iconClass, 'text-amber-600 animate-pulse')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ມອບໝາຍ' || raw === 'ມອບໝາຍແລ້ວ') {
    return (
      <Badge variant="info" size={size} icon={<UserCheck className={clsx(iconClass, 'text-sky-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ຮັບວຽກ' || raw === 'ຮັບວຽກແລ້ວ') {
    return (
      <Badge variant="info" size={size} icon={<CheckSquare className={clsx(iconClass, 'text-sky-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ກວດກາ' || raw === 'ກຳລັງກວດກາ') {
    return (
      <Badge variant="purple" size={size} icon={<Eye className={clsx(iconClass, 'text-purple-600 animate-pulse')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ອະນຸມັດ' || raw === 'ອະນຸມັດແລ້ວ') {
    return (
      <Badge variant="success" size={size} icon={<CheckCircle2 className={clsx(iconClass, 'text-emerald-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ປະຕິເສດ' || raw === 'ສົ່ງກັບຄືນ' || raw === 'ສົ່ງກັບຄືນແກ້ໄຂ') {
    return (
      <Badge variant="danger" size={size} icon={<XCircle className={clsx(iconClass, 'text-red-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ໃໝ່') {
    return (
      <Badge variant="info" size={size} icon={<Sparkles className={clsx(iconClass, 'text-sky-600')} />} className={className}>
        ໃໝ່
      </Badge>
    );
  }
  if (raw === 'ລົງທະບຽນ' || raw === 'ລົງທະບຽນແລ້ວ') {
    return (
      <Badge variant="default" size={size} icon={<FileText className={clsx(iconClass, 'text-blue-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ສົ່ງອອກ' || raw === 'ສົ່ງອອກແລ້ວ') {
    return (
      <Badge variant="success" size={size} icon={<Send className={clsx(iconClass, 'text-teal-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ຈັດເກັບ' || raw === 'ຈັດເກັບແລ້ວ') {
    return (
      <Badge variant="gray" size={size} icon={<Archive className={clsx(iconClass, 'text-slate-500')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ຍົກເລີກ') {
    return (
      <Badge variant="danger" size={size} icon={<Ban className={clsx(iconClass, 'text-red-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }
  if (raw === 'ລໍຖ້າ') {
    return (
      <Badge variant="warning" size={size} icon={<Hourglass className={clsx(iconClass, 'text-amber-600')} />} className={className}>
        {raw}
      </Badge>
    );
  }

  // Fallback for custom/unrecognized statuses with an Activity icon
  return (
    <Badge variant="gray" size={size} icon={<Activity className={clsx(iconClass, 'text-slate-500')} />} className={className}>
      {raw || 'ບໍ່ລະບຸ'}
    </Badge>
  );
};

export const EmployeeStatusBadge: React.FC<{
  isActive: boolean;
  className?: string;
  size?: 'sm' | 'md';
}> = ({ isActive, className, size = 'sm' }) => {
  return (
    <StatusBadge
      status={isActive ? 'ACTIVE' : 'INACTIVE'}
      className={className}
      size={size}
    />
  );
};

export const PriorityBadge: React.FC<{ priority?: string | null; className?: string; size?: 'sm' | 'md' }> = ({
  priority,
  className,
  size = 'md',
}) => {
  const normalized = (priority || '').trim().toUpperCase();

  switch (normalized) {
    case 'URGENTEST':
      return (
        <Badge variant="danger" size={size} icon={<Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />} className={className}>
          🚨 ຮີບດ່ວນທີ່ສຸດ
        </Badge>
      );
    case 'URGENT':
      return (
        <Badge variant="danger" size={size} icon={<Zap className="w-3.5 h-3.5 text-red-600 fill-red-500" />} className={className}>
          ⚡ ຮີບດ່ວນ
        </Badge>
      );
    case 'HIGH':
      return (
        <Badge variant="warning" size={size} icon={<ArrowUp className="w-3.5 h-3.5 text-amber-600" />} className={className}>
          🔺 ສູງ
        </Badge>
      );
    case 'LOW':
      return (
        <Badge variant="gray" size={size} icon={<ArrowDown className="w-3.5 h-3.5 text-slate-500" />} className={className}>
          🔽 ຕ່ຳ
        </Badge>
      );
    case 'NORMAL':
    default:
      return (
        <Badge variant="default" size={size} icon={<Clock className="w-3.5 h-3.5 text-blue-600" />} className={className}>
          🔹 ປົກກະຕິ
        </Badge>
      );
  }
};

