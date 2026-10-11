import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  headerClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
  footer,
  noPadding = false,
  headerClassName,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
          className
        )
      )}
      {...props}
    >
      {(title || action) && (
        <div
          className={twMerge(
            clsx(
              'px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50/90 via-sky-50/30 to-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4',
              headerClassName
            )
          )}
        >
          <div className="min-w-0">
            {typeof title === 'string' ? (
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 flex items-center flex-wrap gap-2">{action}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-3.5 sm:p-5'}>{children}</div>

      {footer && (
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50/80 via-sky-50/20 to-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
