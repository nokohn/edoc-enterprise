import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle, Clock, FileText, Send, Flame, ShieldAlert, Award, Zap, ArrowUp, ArrowDown } from 'lucide-react';

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
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-full border',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  switch (status) {
    case 'NEW':
      return (
        <Badge variant="info" icon={<Clock className="w-3 h-3" />} className={className}>
          ໃໝ່ (New)
        </Badge>
      );
    case 'REGISTERED':
      return (
        <Badge variant="default" icon={<FileText className="w-3 h-3" />} className={className}>
          ລົງທະບຽນແລ້ວ (Registered)
        </Badge>
      );
    case 'REVIEWING':
    case 'REVIEW':
      return (
        <Badge variant="purple" icon={<Clock className="w-3 h-3" />} className={className}>
          ກຳລັງກວດກາ (Reviewing)
        </Badge>
      );
    case 'ASSIGNED':
      return (
        <Badge variant="info" icon={<Clock className="w-3 h-3" />} className={className}>
          ມອບໝາຍແລ້ວ (Assigned)
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="warning" icon={<Clock className="w-3 h-3 animate-pulse" />} className={className}>
          ກຳລັງດຳເນີນການ (In Progress)
        </Badge>
      );
    case 'DEPT_APPROVAL':
    case 'MANAGEMENT_APPROVAL':
    case 'DIRECTOR_APPROVAL':
      return (
        <Badge variant="warning" icon={<Clock className="w-3 h-3" />} className={className}>
          ລໍຖ້າອະນຸມັດ (Pending Approval)
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />} className={className}>
          ອະນຸມັດແລ້ວ (Approved)
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />} className={className}>
          ສຳເລັດສົມບູນ (Completed)
        </Badge>
      );
    case 'SENT':
      return (
        <Badge variant="success" icon={<Send className="w-3 h-3" />} className={className}>
          ສົ່ງອອກແລ້ວ (Sent)
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="danger" icon={<AlertCircle className="w-3 h-3" />} className={className}>
          ສົ່ງກັບຄືນ / ປະຕິເສດ (Rejected)
        </Badge>
      );
    case 'ARCHIVED':
      return (
        <Badge variant="gray" className={className}>
          ຈັດເກັບແລ້ວ (Archived)
        </Badge>
      );
    default:
      return <Badge variant="gray" className={className}>{status}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: string; className?: string }> = ({ priority, className }) => {
  switch (priority) {
    case 'URGENTEST':
      return (
        <Badge variant="danger" icon={<Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />} className={className}>
          🚨 ຮີບດ່ວນທີ່ສຸດ
        </Badge>
      );
    case 'URGENT':
      return (
        <Badge variant="danger" icon={<Zap className="w-3.5 h-3.5 text-red-600 fill-red-500" />} className={className}>
          ⚡ ຮີບດ່ວນ
        </Badge>
      );
    case 'HIGH':
      return (
        <Badge variant="warning" icon={<ArrowUp className="w-3.5 h-3.5 text-amber-600" />} className={className}>
          🔺 ສູງ
        </Badge>
      );
    case 'LOW':
      return (
        <Badge variant="gray" icon={<ArrowDown className="w-3.5 h-3.5 text-slate-500" />} className={className}>
          🔽 ຕ່ຳ
        </Badge>
      );
    case 'NORMAL':
    default:
      return (
        <Badge variant="default" icon={<Clock className="w-3.5 h-3.5 text-blue-600" />} className={className}>
          🔹 ປົກກະຕິ
        </Badge>
      );
  }
};
