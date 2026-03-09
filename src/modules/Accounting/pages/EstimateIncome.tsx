import { useState, useEffect } from 'react'
import {
  fetchEstimateIncomeCategories,
  fetchAllEstimateIncomeSubsWithParent,
  createEstimateIncomeSub,
  updateEstimateIncomeSub,
  deleteEstimateIncomeSub,
  type EstimateIncome,
  type EstimateIncomeSubWithParent,
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
  onSubmit: (data: {
    estimate_income: string
    description: string
  }) => void
  categories: EstimateIncome[]
  editData?: EstimateIncomeSubWithParent | null
  isLoading?: boolean
}

const EstimateIncomeSubDialog = ({
  open,
  onClose,
  onSubmit,
  categories,
  editData,
  isLoading = false,
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
    onSubmit({
      estimate_income: categoryId,
      description: description.trim(),
    })
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
          id="specificType"
          label="Specific Type / Name"
          type="text"
          value={specificType}
          onChange={setSpecificType}
          placeholder="e.g., Real Property Tax, Business Tax"
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
  const [subcategories, setSubcategories] = useState<EstimateIncomeSubWithParent[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<EstimateIncomeSubWithParent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Load data
  useEffect(() => {
    loadData()
  }, [])

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

  const handleEdit = (item: EstimateIncomeSubWithParent) => {
    setEditData(item)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`Are you sure you want to delete "${description}"?`)) return

    try {
      setLoading(true)
      await deleteEstimateIncomeSub(id)
      await loadData()
      alert('Deleted successfully!')
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Failed to delete. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: {
    estimate_income: string
    description: string
  }) => {
    try {
      setLoading(true)
      if (editData) {
        await updateEstimateIncomeSub(editData.id, {
          description: data.description,
          editable: true,
          status: true,
        })
        alert('Updated successfully!')
      } else {
        await createEstimateIncomeSub({
          estimate_income: data.estimate_income,
          description: data.description,
          editable: true,
          status: true,
        })
        alert('Added successfully!')
      }
      setDialogOpen(false)
      await loadData()
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert(error?.message || 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter subcategories
  const filteredSubcategories = subcategories.filter((sub) => {
    const matchesSearch =
      sub.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.estimate_income_data?.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || sub.estimate_income === selectedCategory
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

      {/* Summary Cards */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by description or source type..."
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
                  Specific Type / Name
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && subcategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filteredSubcategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredSubcategories.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                        {item.estimate_income_data?.description || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground italic">—</td>
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
                          onClick={() => handleDelete(item.id, item.description)}
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
        categories={categories}
        editData={editData}
        isLoading={loading}
      />
    </div>
  )
}
