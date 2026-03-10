import { useState } from 'react'
import { Pencil, Trash2, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FullEstimateEntry } from '@/services/accountingService'

interface EstimateIncomeTableProps {
  entries: FullEstimateEntry[]
  filteredEntries: FullEstimateEntry[]
  loading: boolean
  onEdit: (item: FullEstimateEntry) => void
  onDelete: (item: FullEstimateEntry) => void
}

const ROWS_PER_PAGE = 10

const sourceBadgeColors: Record<string, { bg: string; text: string }> = {
  'Local Sources': { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  'External Sources': { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
}

const defaultBadge = { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700' }

export default function EstimateIncomeTable({
  entries,
  filteredEntries,
  loading,
  onEdit,
  onDelete,
}: EstimateIncomeTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ROWS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  if (safePage !== currentPage) setCurrentPage(safePage)

  const startIdx = (safePage - 1) * ROWS_PER_PAGE
  const pageData = filteredEntries.slice(startIdx, startIdx + ROWS_PER_PAGE)

  const columns = [
    { key: 'source_type', header: 'Source Type' },
    { key: 'subcategory', header: 'Description / Subcategory' },
    { key: 'income', header: 'Source of Income' },
    { key: 'revenue', header: 'Revenue Account' },
    { key: 'revenue_sub', header: 'Revenue Account Sub' },
    { key: 'actions', header: 'Actions' },
  ]

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-success"><FileSpreadsheet className="w-5 h-5" /></span>
        <h2 className="text-lg font-semibold text-foreground">Income Entries</h2>
        <span className="ml-auto text-xs text-muted font-medium">
          {filteredEntries.length} record{filteredEntries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border text-xs uppercase tracking-wider',
                    col.key === 'actions' && 'text-center'
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success" />
                    <span className="text-muted text-sm">Loading entries...</span>
                  </div>
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-10 h-10 text-muted/40" />
                    <span className="text-muted text-sm">No records found</span>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {pageData.map((item, index) => {
                  const badge = sourceBadgeColors[item.income_source_description] || defaultBadge
                  return (
                    <tr
                      key={`${item.source_of_income_id}-${item.revenue_account_id}-${item.revenue_account_sub_id}-${index}`}
                      className="hover:bg-background transition-colors group"
                    >
                      <td className="px-4 py-3.5 border-b border-border/50">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border',
                          badge.bg, badge.text
                        )}>
                          {item.income_source_description || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-b border-border/50 font-medium text-foreground">
                        {item.subcategory_description || '—'}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border/50 text-foreground">
                        {item.source_type || '—'}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border/50 text-foreground">
                        {item.revenue_type || <span className="text-muted italic">—</span>}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border/50 text-foreground">
                        {item.revenue_type_sub || <span className="text-muted italic">—</span>}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border/50 text-center">
                        <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(item)}
                            disabled={loading}
                            className="p-2 text-info hover:bg-info/10 rounded-lg disabled:opacity-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            disabled={loading}
                            className="p-2 text-error hover:bg-error/10 rounded-lg disabled:opacity-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {/* Pad empty rows to keep table height consistent */}
                {Array.from({ length: ROWS_PER_PAGE - pageData.length }).map((_, i) => (
                  <tr key={`pad-${i}`}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5 border-b border-border/50">&nbsp;</td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted">
        <span>
          {filteredEntries.length > 0
            ? `Showing ${startIdx + 1}–${Math.min(startIdx + ROWS_PER_PAGE, filteredEntries.length)} of ${filteredEntries.length}`
            : '0 results'}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              className="p-1.5 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1
              if (page === 1 || page === totalPages || Math.abs(page - safePage) <= 1) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'min-w-[32px] h-8 rounded text-sm font-medium transition-colors',
                      page === safePage ? 'bg-success text-white' : 'hover:bg-background'
                    )}
                  >
                    {page}
                  </button>
                )
              }
              if (page === 2 && safePage > 3) return <span key="start-dots" className="px-1">…</span>
              if (page === totalPages - 1 && safePage < totalPages - 2) return <span key="end-dots" className="px-1">…</span>
              return null
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
              className="p-1.5 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
