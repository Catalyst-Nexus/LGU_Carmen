import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { FormInput } from '@/components/ui/dialog'
import type {
  EstimateIncome,
  FullEstimateEntry,
  CreateFullEstimatePayload,
} from '@/services/accountingService'

/* ── Form Select ─────────────────────────────────────────────────── */
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

/* ── Props ────────────────────────────────────────────────────────── */
export interface UpdateEstimatePayload {
  source_of_income_id: string
  source_type: string
  revenue_account_id: string | null
  revenue_type: string
  revenue_account_sub_id: string | null
  revenue_type_sub: string
}

interface EstimateIncomeDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateFullEstimatePayload) => void
  onUpdate: (data: UpdateEstimatePayload) => void
  categories: EstimateIncome[]
  editData?: FullEstimateEntry | null
  isLoading?: boolean
}

/* ── Component ────────────────────────────────────────────────────── */
export default function EstimateIncomeDialog({
  open,
  onClose,
  onSubmit,
  onUpdate,
  categories,
  editData,
  isLoading = false,
}: EstimateIncomeDialogProps) {
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
