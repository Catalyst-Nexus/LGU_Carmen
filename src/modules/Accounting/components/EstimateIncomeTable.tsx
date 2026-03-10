import { Pencil, Trash2 } from 'lucide-react'
import type { FullEstimateEntry } from '@/services/accountingService'

interface EstimateIncomeTableProps {
  entries: FullEstimateEntry[]
  filteredEntries: FullEstimateEntry[]
  loading: boolean
  onEdit: (item: FullEstimateEntry) => void
  onDelete: (item: FullEstimateEntry) => void
}

export default function EstimateIncomeTable({
  entries,
  filteredEntries,
  loading,
  onEdit,
  onDelete,
}: EstimateIncomeTableProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Source Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description / Subcategory
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Source of Income
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Revenue Account
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Revenue Account Sub
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No records found
                </td>
              </tr>
            ) : (
              filteredEntries.map((item, index) => (
                <tr
                  key={`${item.source_of_income_id}-${item.revenue_account_id}-${item.revenue_account_sub_id}-${index}`}
                  className="hover:bg-muted/30"
                >
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                      {item.income_source_description || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {item.subcategory_description || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {item.source_type || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {item.revenue_type || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {item.revenue_type_sub || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        disabled={loading}
                        className="p-1.5 text-info hover:bg-info/10 rounded disabled:opacity-50"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        disabled={loading}
                        className="p-1.5 text-error hover:bg-error/10 rounded disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
