'use client';

import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
  role?: 'primary' | 'trailing' | 'detail' | 'action';
  headerHidden?: boolean;
}

const ALIGN: Record<string, string> = {
  start: 'text-start',
  end: 'text-end',
  center: 'text-center',
};

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  href,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  href?: (row: T) => string;
}) {
  const router = useRouter();
  const detailColumns = columns.filter((column) => (column.role ?? 'detail') === 'detail');
  const primary = columns.find((column) => column.role === 'primary');
  const trailing = columns.filter((column) => column.role === 'trailing' || column.role === 'action');

  function navigate(row: T) {
    if (href) {
      router.push(href(row));
    }
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-xs md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'h-11 px-4 text-xs font-medium tracking-wide text-muted-foreground',
                    ALIGN[column.align ?? 'start'],
                    column.className,
                  )}
                >
                  {!column.headerHidden && column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyOf(row)}
                data-slot="table-row"
                onClick={() => navigate(row)}
                className={cn(
                  'border-b border-border last:border-0',
                  href && 'cursor-pointer transition-colors hover:bg-accent/50',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn('px-4 py-3.5 align-middle', ALIGN[column.align ?? 'start'], column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2.5 md:hidden">
        {rows.map((row) => (
          <div
            key={keyOf(row)}
            onClick={() => navigate(row)}
            className={cn(
              'rounded-xl border border-border bg-card p-4 shadow-xs',
              href && 'cursor-pointer transition-colors active:bg-accent/50',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              {primary && <div className="min-w-0 font-medium">{primary.cell(row)}</div>}
              {trailing.length > 0 && (
                <div className="flex shrink-0 items-center gap-1.5">
                  {trailing.map((column) => (
                    <span key={column.id}>{column.cell(row)}</span>
                  ))}
                </div>
              )}
            </div>
            {detailColumns.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {detailColumns.map((column) => (
                  <div key={column.id} className="min-w-0 space-y-0.5">
                    <dt className="text-xs text-muted-foreground">{column.header}</dt>
                    <dd className="text-sm">{column.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
