import { cn } from '@/lib/utils';

export interface TransactionColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

interface TransactionTableProps {
  columns: TransactionColumn[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
  className?: string;
}

const TransactionTable = ({
  columns,
  data,
  emptyMessage = 'No transactions found.',
  className,
}: TransactionTableProps) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const thAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={cn('bg-surface border border-border rounded-2xl p-6 overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            {columns.map(col => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 font-semibold text-muted uppercase text-xs tracking-wide',
                  thAlignClasses[col.align || 'left']
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-8 border-b border-border/50">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                {columns.map(col => (
                  <td
                    key={String(col.key)}
                    className={cn('px-4 py-3 text-foreground', alignClasses[col.align || 'left'])}
                  >
                    {col.render ? col.render(row) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
