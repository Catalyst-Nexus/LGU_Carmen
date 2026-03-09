import { useState, useEffect, useCallback } from 'react'
import {
  fetchEstimateIncomeCategories,
  fetchAllEstimateIncomeSubsWithParent,
  createEstimateIncomeSub,
  updateEstimateIncomeSub,
  deleteEstimateIncomeSub,
  type EstimateIncome,
  type EstimateIncomeSubWithParent,
} from '@/services/accountingService'
import {
  Plus, Pencil, Trash2, Search, X, DollarSign, ArrowDownRight,
  ArrowUpRight, FileText, ChevronDown, AlertTriangle, CheckCircle2,
  XCircle, Loader2, Filter,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { FormInput } from '@/components/ui/dialog'

/* ── Badge color map for source types ─────────────────────────────── */
const SOURCE_COLORS: Record<string, { bg: string; text: string; icon: typeof ArrowDownRight }> = {
  'Local Sources': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: ArrowUpRight },
  'External Sources': { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', icon: ArrowDownRight },
}

const getSourceStyle = (name?: string) =>
  SOURCE_COLORS[name || ''] ?? { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: FileText }

/* ── Toast notification ───────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'warning'

const Toast = ({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle2 }> = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 },
    error: { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', icon: XCircle },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', icon: AlertTriangle },
  }
  const s = styles[type]
  const Icon = s.icon
  const textColor = type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : type === 'error' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg} ${s.border} shadow-lg animate-[slideIn_0.3s_ease-out]`}>
      <Icon className={`w-5 h-5 ${textColor} shrink-0`} />
      <span className={`text-sm font-medium ${textColor}`}>{message}</span>
      <button onClick={onClose} aria-label="Dismiss notification" className={`p-0.5 rounded-md hover:bg-black/5 ${textColor}`}>
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ── Skeleton loader row ──────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-5 py-4"><div className="h-6 w-28 bg-muted/40 rounded-full" /></td>
    <td className="px-5 py-4"><div className="h-5 w-48 bg-muted/40 rounded-md" /></td>
    <td className="px-5 py-4"><div className="h-5 w-32 bg-muted/40 rounded-md" /></td>
    <td className="px-5 py-4"><div className="h-5 w-16 mx-auto bg-muted/40 rounded-md" /></td>
  </tr>
)

/* ── Stat card ────────────────────────────────────────────────────── */
const StatCard = ({ label, count, icon: Icon, color }: { label: string; count: number; icon: typeof DollarSign; color: string }) => (
  <div className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:shadow-md transition-shadow">
    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground leading-none">{count}</p>
      <p className="text-xs text-muted mt-1 font-medium">{label}</p>
    </div>
  </div>
)

/* ── Confirmation Dialog ──────────────────────────────────────────── */
const ConfirmDialog = ({
  open, onClose, onConfirm, title, message, loading,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; loading: boolean
}) => (
  <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl z-50 p-6">
        <Dialog.Description className="hidden">Confirm action</Dialog.Description>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
            <p className="text-sm text-muted mt-1.5">{message}</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <Dialog.Close className="flex-1 px-4 py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-background transition-colors">
              Cancel
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
)

/* ── Form Select Component ────────────────────────────────────────── */
const FormSelect = ({
  id, label, value, onChange, required, disabled, children,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; required?: boolean; disabled?: boolean; children: React.ReactNode
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold text-foreground">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      <select
        id={id}
        className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition-all appearance-none pr-10 disabled:bg-muted/20 disabled:cursor-not-allowed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
    </div>
  </div>
)

/* ── Estimate Income Sub Dialog ──────────────────────────────────── */
interface EstimateIncomeSubDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { estimate_income: string; description: string }) => void
  categories: EstimateIncome[]
  editData?: EstimateIncomeSubWithParent | null
  isLoading?: boolean
}

const EstimateIncomeSubDialog = ({
  open, onClose, onSubmit, categories, editData, isLoading = false,
}: EstimateIncomeSubDialogProps) => {
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [specificType, setSpecificType] = useState('')

  useEffect(() => {
    if (editData) {
      setCategoryId(editData.estimate_income)
      setDescription(editData.description)
      setSpecificType('')
    } else {
      setCategoryId('')
      setDescription('')
      setSpecificType('')
    }
  }, [editData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ estimate_income: categoryId, description: description.trim() })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-[fadeIn_0.2s_ease-out]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] bg-surface border border-border rounded-2xl shadow-2xl z-50 flex flex-col animate-[scaleIn_0.2s_ease-out]">
          <Dialog.Description className="hidden">Income estimate form</Dialog.Description>

          {/* Header with accent bar */}
          <div className="relative overflow-hidden rounded-t-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-success via-emerald-400 to-teal-400" />
            <div className="flex items-center justify-between p-5 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success/10">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <Dialog.Title className="text-lg font-bold text-foreground">
                  {editData ? 'Edit Estimate' : 'New Estimate'}
                </Dialog.Title>
              </div>
              <Dialog.Close className="p-2 rounded-xl hover:bg-muted/20 transition-colors text-muted">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
          </div>

          <div className="p-5 pt-2 overflow-y-auto flex-1">
            <form id="estimate-form" onSubmit={handleSubmit} className="space-y-5">
              <FormSelect
                id="category"
                label="Income Source Type"
                value={categoryId}
                onChange={setCategoryId}
                required
                disabled={!!editData}
              >
                <option value="">-- Select Type --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.description}</option>
                ))}
              </FormSelect>

              <FormInput
                id="description"
                label="Description / Subcategory"
                type="text"
                value={description}
                onChange={setDescription}
                required
                placeholder="e.g., Tax Revenue, Non-Tax Revenue"
              />

              <FormInput
                id="specificType"
                label="Specific Type / Name"
                type="text"
                value={specificType}
                onChange={setSpecificType}
                placeholder="e.g., Real Property Tax, Business Tax"
              />
            </form>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-border bg-muted/5 rounded-b-2xl">
            <Dialog.Close className="px-5 py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-background transition-colors disabled:opacity-50">
              Cancel
            </Dialog.Close>
            <button
              type="submit"
              form="estimate-form"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-success rounded-xl hover:bg-success/90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm shadow-success/20"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : editData ? 'Update' : (
                <><Plus className="w-4 h-4" /> Add Estimate</>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ── Main Component ───────────────────────────────────────────────── */
export default function EstimateIncomePage() {
  const [categories, setCategories] = useState<EstimateIncome[]>([])
  const [subcategories, setSubcategories] = useState<EstimateIncomeSubWithParent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<EstimateIncomeSubWithParent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; description: string } | null>(null)

  const showToast = useCallback((message: string, type: ToastType) => setToast({ message, type }), [])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [cats, subs] = await Promise.all([
        fetchEstimateIncomeCategories(),
        fetchAllEstimateIncomeSubsWithParent(),
      ])
      setCategories(cats)
      setSubcategories(subs)
    } catch (error) {
      console.error('Failed to load data:', error)
      showToast('Failed to load data. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => { setEditData(null); setDialogOpen(true) }

  const handleEdit = (item: EstimateIncomeSubWithParent) => { setEditData(item); setDialogOpen(true) }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setSaving(true)
      await deleteEstimateIncomeSub(deleteTarget.id)
      await loadData()
      showToast('Deleted successfully!', 'success')
    } catch (error) {
      console.error('Failed to delete:', error)
      showToast('Failed to delete. Please try again.', 'error')
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  const handleSubmit = async (data: { estimate_income: string; description: string }) => {
    try {
      setSaving(true)
      if (editData) {
        await updateEstimateIncomeSub(editData.id, { description: data.description, editable: true, status: true })
        showToast('Updated successfully!', 'success')
      } else {
        await createEstimateIncomeSub({ estimate_income: data.estimate_income, description: data.description, editable: true, status: true })
        showToast('Added successfully!', 'success')
      }
      setDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('Failed to save:', error)
      showToast(error?.message || 'Failed to save. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredSubcategories = subcategories.filter((sub) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      sub.description.toLowerCase().includes(q) ||
      sub.estimate_income_data?.description.toLowerCase().includes(q)
    const matchesCategory = selectedCategory === 'all' || sub.estimate_income === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Category stats
  const localCount = subcategories.filter(s => s.estimate_income_data?.description === 'Local Sources').length
  const externalCount = subcategories.filter(s => s.estimate_income_data?.description === 'External Sources').length

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Estimates of Income
          </h1>
          <p className="text-sm text-muted">
            Manage revenue estimates from local and external sources
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-success rounded-xl hover:bg-success/90 disabled:opacity-50 transition-all shadow-sm shadow-success/20 hover:shadow-md hover:shadow-success/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Estimate
        </button>
      </div>

      {/* ── Summary Stats ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Estimates" count={subcategories.length} icon={DollarSign} color="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard label="Local Sources" count={localCount} icon={ArrowUpRight} color="bg-gradient-to-br from-emerald-500 to-green-600" />
        <StatCard label="External Sources" count={externalCount} icon={ArrowDownRight} color="bg-gradient-to-br from-sky-500 to-blue-600" />
      </div>

      {/* ── Search & Filter ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-success transition-colors" />
          <input
            type="text"
            placeholder="Search by description or source type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success transition-all placeholder:text-muted/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-muted/20 text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by source category"
            className="pl-10 pr-10 py-2.5 border border-border rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-success/20 focus:border-success transition-all appearance-none min-w-[180px]"
          >
            <option value="all">All Sources</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.description}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* ── Results count ───────────────────────────────── */}
      {!loading && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-success/10 text-success font-bold text-[11px]">
            {filteredSubcategories.length}
          </span>
          {searchQuery || selectedCategory !== 'all' ? 'results found' : 'total records'}
          {(searchQuery || selectedCategory !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setSelectedCategory('all') }} className="text-success hover:underline font-medium ml-1" aria-label="Clear all filters">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-widest">
                  Source Type
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-widest">
                  Description / Subcategory
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted uppercase tracking-widest">
                  Specific Type / Name
                </th>
                <th className="px-5 py-3.5 text-center text-[11px] font-semibold text-muted uppercase tracking-widest w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <>
                  <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                </>
              ) : filteredSubcategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/20">
                        <FileText className="w-8 h-8 text-muted/50" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">No records found</p>
                        <p className="text-xs text-muted">
                          {searchQuery ? 'Try a different search term or clear filters' : 'Get started by adding your first income estimate'}
                        </p>
                      </div>
                      {!searchQuery && (
                        <button
                          onClick={handleAdd}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-success bg-success/10 rounded-lg hover:bg-success/20 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add First Estimate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubcategories.map((item) => {
                  const style = getSourceStyle(item.estimate_income_data?.description)
                  const SourceIcon = style.icon
                  return (
                    <tr
                      key={item.id}
                      className="group hover:bg-success/[0.03] transition-colors"
                    >
                      <td className="px-5 py-4 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${style.bg} ${style.text}`}>
                          <SourceIcon className="w-3.5 h-3.5" />
                          {item.estimate_income_data?.description || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-foreground">{item.description}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-muted/60">—</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(item)}
                            disabled={saving}
                            className="p-2 rounded-lg text-info hover:bg-info/10 transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: item.id, description: item.description })}
                            disabled={saving}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────── */}
      <EstimateIncomeSubDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        categories={categories}
        editData={editData}
        isLoading={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Estimate"
        message={`Are you sure you want to delete "${deleteTarget?.description}"? This action cannot be undone.`}
        loading={saving}
      />
    </div>
  )
}
