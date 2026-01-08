"use client";

import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export interface Column<T> {
  key: string;
  header?: string;
  label?: string; // Alias for header
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page?: number; // Alternative to currentPage
    currentPage?: number;
    limit?: number; // Alternative to pageSize
    pageSize?: number;
    total?: number; // Alternative to totalItems
    totalItems?: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
  };
  onPageChange?: (page: number) => void; // Can be passed separately
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = "Veri bulunamadı",
  pagination,
  onPageChange: externalOnPageChange,
  onRowClick,
}: DataTableProps<T>) {
  // Normalize pagination props to handle both formats
  const currentPage = pagination?.currentPage || pagination?.page || 1;
  const pageSize = pagination?.pageSize || pagination?.limit || 20;
  const totalItems = pagination?.totalItems || pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;
  const handlePageChange = externalOnPageChange || pagination?.onPageChange || (() => {});

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-12 text-center">
          <p className="text-slate-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider ${
                    column.className || ""
                  }`}
                >
                  {column.label || column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((item, index) => (
              <tr
                key={index}
                className={`hover:bg-slate-50 transition ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-slate-900 ${
                      column.className || ""
                    }`}
                  >
                    {column.render
                      ? column.render(item)
                      : item[column.key]?.toString() || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {totalItems > 0 && pageSize && (
              <>
                <span className="font-medium">
                  {(currentPage - 1) * pageSize + 1}
                </span>
                {" - "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * pageSize,
                    totalItems
                  )}
                </span>
                {" / "}
                <span className="font-medium">{totalItems}</span>
                {" kayıt"}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Önceki
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  );
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-slate-400">...</span>
                      )}
                      <Button
                        variant={
                          page === currentPage ? "primary" : "ghost"
                        }
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[2rem]"
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sonraki
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
