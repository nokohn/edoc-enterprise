import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        <div
          className={twMerge(
            clsx(
              'w-full transform rounded-2xl bg-white text-left align-middle shadow-2xl transition-all',
              'border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden',
              maxWidths[maxWidth]
            )
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          {(title || subtitle) && (
            <div className="px-4 py-3 sm:px-6 sm:py-4.5 border-b border-slate-200/90 flex items-center justify-between gap-3 sm:gap-4 bg-gradient-to-r from-slate-50/95 via-sky-50/50 to-blue-50/30">
              <div className="min-w-0 flex-1">
                {typeof title === 'string' ? (
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h3>
                ) : (
                  title
                )}
                {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 focus:outline-none transition-colors border border-transparent hover:border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-3.5 sm:px-6 py-3.5 sm:py-5 max-h-[calc(90vh-110px)] overflow-y-auto">{children}</div>

          {/* Footer Bar */}
          {footer && (
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-slate-50/90 via-sky-50/25 to-slate-50/90 border-t border-slate-200/80 flex items-center justify-end gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
