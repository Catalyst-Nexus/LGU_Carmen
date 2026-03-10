import { useState, useEffect } from 'react'
import {
  fetchEstimateIncomeCategories,
  fetchFullEstimateEntries,
  createFullEstimateEntry,
  updateFullEstimateEntry,
  deleteFullEstimateEntry,
  type EstimateIncome,
  type FullEstimateEntry,
  type CreateFullEstimatePayload,
} from '@/services/accountingService'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { FormInput } from '@/components/ui/dialog'

/* ── Form Select Component ────────────────────────────────────────── */
const FormSelect = ({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  disabled?: boolean
  children: React.ReactNode
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    <select
      id={id}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
    >
      {children}
    </select>
  </div>
)

/* ── Estimate Income Sub Dialog ──────────────────────────────────── */
interface EstimateIncomeSubDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateFullEstimatePayload) => void
  onUpdate: (data: {
    source_of_income_id: string
    source_type: string
    revenue_account_id: string | null
    revenue_type: string
    revenue_account_sub_id: string | null
    revenue_type_sub: string
  }) => void
  categories: EstimateIncome[]
  editData?: FullEstimateEntry | null
  isLoading?: boolean
}

const EstimateIncomeSubDialog = ({
  open,
  onClose,
  onSubmit,
  onUpdate,
  categories,
  editData,
  isLoading = false,
}: EstimateIncomeSubDialogProps) => {
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [revenueType, setRevenueType] = useState('')
  const [revenueTypeSub, setRevenueTypeSub] = useState('')

  useEffect(() => {
    if (editData) {
      setCategoryId(editData.estimate_income_id)
      setDescription(editData.subcategory_description)
      setSourceType(editData.source_type)
      setRevenueType(editData.revenue_type || '')
      setRevenueTypeSub(editData.revenue_type_sub || '')
    } else {
      setCategoryId('')
      setDescription('')
      setSourceType('')
      setRevenueType('')
      setRevenueTypeSub('')
    }
  }, [editData, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editData) {
      onUpdate({
        source_of_income_id: editData.source_of_income_id,
        source_type: sourceType,
        revenue_account_id: editData.revenue_account_id,
        revenue_type: revenueType,
        revenue_account_sub_id: editData.revenue_account_sub_id,
        revenue_type_sub: revenueTypeSub,
      })
    } else {
      onSubmit({
        estimate_income_id: categoryId,
        description: description.trim(),
        source_type: sourceType.trim(),
        revenue_type: revenueType.trim(),
        revenue_type_sub: revenueTypeSub.trim(),
      })
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] bg-surface border border-border rounded-2xl shadow-2xl z-50 flex flex-col">
          <Dialog.Description className="hidden">Income estimate form</Dialog.Description>
          
          <div className="flex items-center justify-between p-5 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-primary">
              {editData ? 'Edit Income Estimate' : 'Add Income Estimate'}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-lg hover:bg-background transition-colors text-muted">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            <form id="estimate-form" onSubmit={handleSubmit} className="space-y-4">
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
                  <option key={cat.id} value={cat.id}>
                    {cat.description}
                  </option>
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
                id="sourceType"
                label="Source of Income"
                type="text"
                value={sourceType}
                onChange={setSourceType}
                required
                placeholder="e.g., Real Property Tax, Business Tax"
              />

              <FormInput
                id="revenueType"
                label="Revenue Account"
                type="text"
                value={revenueType}
                onChange={setRevenueType}
                required
                placeholder="e.g., Land Tax, Permit Fees"
              />

              <FormInput
                id="revenueTypeSub"
                label="Revenue Account Sub"
                type="text"
                value={revenueTypeSub}
                onChange={setRevenueTypeSub}
                required
                placeholder="e.g., Residential, Commercial"
              />
            </form>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-border">
            <Dialog.Close className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted disabled:opacity-50">
              Cancel
            </Dialog.Close>
            <button
              type="submit"
              form="estimate-form"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : editData ? 'Update' : 'Add'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ── Main Component ───────────────────────────────────────────────── */
export default function EstimateIncome() {
  // State
  const [categories, setCategories] = useState<EstimateIncome[]>([])
  const [entries, setEntries] = useState<FullEstimateEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<FullEstimateEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [cats, fullEntries] = await Promise.all([
        fetchEstimateIncomeCategories(),
        fetchFullEstimateEntries(),
      ])
      setCategories(cats)
      setEntries(fullEntries)
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handlers
  const handleAdd = () => {
    setEditData(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: FullEstimateEntry) => {
    setEditData(item)
    setDialogOpen(true)
  }

  const handleDelete = async (item: FullEstimateEntry) => {
    if (!confirm(`Are you sure you want to delete "${item.source_type}"?`)) return

    try {
      setLoading(true)
      await deleteFullEstimateEntry(item.source_of_income_id)
      await loadData()
      alert('Deleted successfully!')
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: CreateFullEstimatePayload) => {
    try {
      setLoading(true)
      await createFullEstimateEntry(data)
      alert('Added successfully!')
      setDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert(error?.message || 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: {
    source_of_income_id: string
    source_type: string
    revenue_account_id: string | null
    revenue_type: string
    revenue_account_sub_id: string | null
    revenue_type_sub: string
  }) => {
    try {
      setLoading(true)
      await updateFullEstimateEntry(data)
      alert('Updated successfully!')
      setDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('Failed to update:', error)
      alert(error?.message || 'Failed to update. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      entry.income_source_description.toLowerCase().includes(q) ||
      entry.subcategory_description.toLowerCase().includes(q) ||
      entry.source_type.toLowerCase().includes(q) ||
      (entry.revenue_type || '').toLowerCase().includes(q) ||
      (entry.revenue_type_sub || '').toLowerCase().includes(q)
    const matchesCategory = selectedCategory === 'all' || entry.estimate_income_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estimates of Income</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage revenue estimates from local and external sources
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Estimate
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by description, source type, or revenue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-success"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by source category"
          className="px-4 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-success"
        >
          <option value="all">All Sources</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.description}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
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
                  <tr key={`${item.source_of_income_id}-${item.revenue_account_id}-${item.revenue_account_sub_id}-${index}`} className="hover:bg-muted/30">
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
                          onClick={() => handleEdit(item)}
                          disabled={loading}
                          className="p-1.5 text-info hover:bg-info/10 rounded disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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

      {/* Dialog */}
      <EstimateIncomeSubDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        onUpdate={handleUpdate}
        categories={categories}
        editData={editData}
        isLoading={loading}
      />
    </div>
  )
}
