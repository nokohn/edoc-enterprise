import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        clsx('animate-pulse bg-slate-200/80 rounded-md', className)
      )}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full space-y-3 p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <LoadingSkeleton className="h-7 w-48" />
        <LoadingSkeleton className="h-7 w-32" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-none">
          {Array.from({ length: cols }).map((_, c) => (
            <LoadingSkeleton
              key={c}
              className={clsx('h-4', c === 0 ? 'w-24' : c === 1 ? 'w-48' : 'w-20')}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
