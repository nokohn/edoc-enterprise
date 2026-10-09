import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './LoadingSkeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    onPageChange: (newPage: number) => void;
  };
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = 'ຄົ້ນຫາ...',
  searchValue,
  onSearchChange,
  filterSlot,
  actionSlot,
  pagination,
  emptyTitle,
  emptyDescription,
  onRowClick,
  renderMobileCard,
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Top Bar: Search, Filters & Actions */}
      {(onSearchChange || filterSlot || actionSlot) && (
        <div className="p-4 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {onSearchChange && (
              <div className="relative min-w-[240px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            {filterSlot && <div className="flex items-center gap-2">{filterSlot}</div>}
          </div>

          {actionSlot && <div className="flex items-center gap-2 shrink-0">{actionSlot}</div>}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-4">
          <TableSkeleton rows={6} cols={columns.length} />
        </div>
      ) : data.length === 0 ? (
        <div className="p-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <>
          {/* Desktop Table View (Visible on md and up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-slate-100/95 via-sky-50/70 to-slate-100/95 text-slate-700 font-bold border-b border-slate-200 select-none">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      className={`px-4 py-3 text-${col.align || 'left'} ${col.className || ''}`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.map((item, idx) => (
                  <tr
                    key={item.id ? String(item.id) : idx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition-colors duration-150 hover:bg-blue-50/40 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-${col.align || 'left'} ${col.className || ''}`}
                      >
                        {col.render
                          ? col.render(item, idx)
                          : (item as any)[col.key] !== undefined
                          ? String((item as any)[col.key])
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Visible on mobile / screens below md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {data.map((item, idx) => (
              <div
                key={item.id ? String(item.id) : idx}
                onClick={() => onRowClick && onRowClick(item)}
                className={`p-4 transition-colors ${onRowClick ? 'active:bg-slate-50' : ''}`}
              >
                {renderMobileCard ? (
                  renderMobileCard(item, idx)
                ) : (
                  <div className="space-y-2">
                    {columns.map((col) => (
                      <div key={col.key} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-500">{col.header}:</span>
                        <div className="text-right text-slate-800">
                          {col.render
                            ? col.render(item, idx)
                            : String((item as any)[col.key] || '-')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination Footer */}
      {pagination && pagination.total > 0 && (
        <div className="px-4 py-3 border-t border-slate-200/80 bg-gradient-to-r from-slate-50/90 via-sky-50/30 to-slate-50/90 flex items-center justify-between text-xs text-slate-600">
          <div>
            ລວມທັງໝົດ <span className="font-semibold text-slate-800">{pagination.total}</span> ລາຍການ
            {' '}(ໜ້າ {pagination.page} ຈາກ {Math.ceil(pagination.total / pagination.limit) || 1})
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">{pagination.page}</span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
