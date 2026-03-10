import { useState, useEffect, useMemo } from 'react'
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
import { Plus, Search, DollarSign, Layers, FolderTree, Filter } from 'lucide-react'
import { PageHeader, ActionsBar, PrimaryButton, StatsRow, StatCard } from '@/components/ui'
import EstimateIncomeDialog, { type UpdateEstimatePayload } from '../components/EstimateIncomeDialog'
import EstimateIncomeTable from '../components/EstimateIncomeTable'

export default function EstimateIncomePage() {
  const [categories, setCategories] = useState<EstimateIncome[]>([])
  const [entries, setEntries] = useState<FullEstimateEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<FullEstimateEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

  const handleUpdate = async (data: UpdateEstimatePayload) => {
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

  // Stats
  const stats = useMemo(() => {
    const uniqueSources = new Set(entries.map((e) => e.source_of_income_id)).size
    const uniqueRevenue = new Set(entries.filter((e) => e.revenue_account_id).map((e) => e.revenue_account_id)).size
    return { total: entries.length, uniqueSources, uniqueRevenue, categories: categories.length }
  }, [entries, categories])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Estimates of Income"
          subtitle="Manage revenue estimates from local and external sources"
          icon={<DollarSign className="w-6 h-6" />}
        />
        <ActionsBar>
          <PrimaryButton onClick={handleAdd} disabled={loading}>
            <Plus className="w-4 h-4" />
            Add Estimate
          </PrimaryButton>
        </ActionsBar>
      </div>

      {/* Summary Cards */}
      <StatsRow>
        <StatCard
          label="Total Entries"
          value={stats.total}
          color="primary"
          icon={<Layers className="w-4 h-4" />}
        />
        <StatCard
          label="Income Sources"
          value={stats.uniqueSources}
          color="success"
          icon={<FolderTree className="w-4 h-4" />}
        />
        <StatCard
          label="Revenue Accounts"
          value={stats.uniqueRevenue}
          color="warning"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          label="Source Types"
          value={stats.categories}
          color="danger"
          icon={<Filter className="w-4 h-4" />}
        />
      </StatsRow>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by description, source type, or revenue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success transition-colors"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by source category"
            className="px-4 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success min-w-[180px] transition-colors"
          >
            <option value="all">All Sources</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <EstimateIncomeTable
        entries={entries}
        filteredEntries={filteredEntries}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <EstimateIncomeDialog
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
