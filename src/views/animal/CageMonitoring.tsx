import { useState, type ReactNode } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, DataTable } from '@/components/ui'
import {
  Scan,
  Weight,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Dna,
  TrendingUp,
  X,
  BarChart3,
} from 'lucide-react'

// Types
interface Animal {
  id: string
  barcodeId: string
  sex: 'M' | 'F'
  currentWeight: number
  lastUpdated: string
  motherId?: string
  fatherId?: string
  status: 'healthy' | 'sick' | 'pending'
  weightHistory: number[]
}

interface Cage {
  id: string
  name: string
  maxCapacity: number
  minWeight: number
  maxWeight: number
  currentOccupancy: number
}

interface SuggestedMovement {
  animalId: string
  barcodeId: string
  currentWeight: number
  newWeight: number
  oldCage: string
  recommendedCage: string
  weightClass: string
}

// Mock Data
const MOCK_CAGES: Cage[] = [
  { id: 'A-101', name: 'Cage A-101', maxCapacity: 12, minWeight: 5, maxWeight: 25, currentOccupancy: 10 },
  { id: 'A-102', name: 'Cage A-102', maxCapacity: 10, minWeight: 25, maxWeight: 50, currentOccupancy: 8 },
  { id: 'B-201', name: 'Cage B-201', maxCapacity: 15, minWeight: 50, maxWeight: 100, currentOccupancy: 14 },
  { id: 'B-202', name: 'Cage B-202', maxCapacity: 8, minWeight: 100, maxWeight: 150, currentOccupancy: 5 },
]

const MOCK_ANIMALS: Animal[] = [
  {
    id: '1',
    barcodeId: 'BAR-2601-001',
    sex: 'M',
    currentWeight: 18.5,
    lastUpdated: '2026-03-04',
    motherId: 'BAR-2601-501',
    fatherId: 'BAR-2601-601',
    status: 'healthy',
    weightHistory: [16.2, 17.1, 17.8, 18.5],
  },
  {
    id: '2',
    barcodeId: 'BAR-2601-002',
    sex: 'F',
    currentWeight: 22.3,
    lastUpdated: '2026-03-05',
    motherId: 'BAR-2601-502',
    fatherId: 'BAR-2601-602',
    status: 'healthy',
    weightHistory: [20.1, 20.8, 21.5, 22.3],
  },
  {
    id: '3',
    barcodeId: 'BAR-2601-003',
    sex: 'M',
    currentWeight: 19.7,
    lastUpdated: '2026-03-02',
    motherId: 'BAR-2601-503',
    fatherId: 'BAR-2601-603',
    status: 'pending',
    weightHistory: [18.5, 19.0, 19.7],
  },
  {
    id: '4',
    barcodeId: 'BAR-2601-004',
    sex: 'F',
    currentWeight: 15.2,
    lastUpdated: '2026-03-05',
    motherId: 'BAR-2601-504',
    fatherId: 'BAR-2601-604',
    status: 'sick',
    weightHistory: [16.1, 15.8, 15.5, 15.2],
  },
]

const WEIGHT_CLASSES = [
  { range: '< 25 kg', target: 'Cage A-101', color: 'bg-blue-500/20 text-blue-400' },
  { range: '25 - 50 kg', target: 'Cage A-102', color: 'bg-green-500/20 text-green-400' },
  { range: '50 - 100 kg', target: 'Cage B-201', color: 'bg-orange-500/20 text-orange-400' },
  { range: '> 100 kg', target: 'Cage B-202', color: 'bg-red-500/20 text-red-400' },
]

// Components
const Breadcrumb = () => (
  <div className="flex items-center gap-2 text-sm text-muted mb-4">
    <span>Management</span>
    <span>&gt;</span>
    <span className="text-primary font-medium">Cage Monitoring</span>
  </div>
)

const UserContext = () => (
  <div className="text-right text-sm text-muted mb-4">
    <span className="font-medium text-foreground">Logged in:</span> Staff-Level 1
  </div>
)

const CageSelector = ({ selectedCage, onCageChange }: { selectedCage: Cage; onCageChange: (cage: Cage) => void }) => (
  <div className="bg-surface border border-border rounded-xl p-5 mb-6">
    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3">Select Cage</label>
    <div className="flex items-center gap-4">
      <select
        value={selectedCage.id}
        onChange={(e) => {
          const cage = MOCK_CAGES.find((c) => c.id === e.target.value)
          if (cage) onCageChange(cage)
        }}
        className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-success transition-colors"
      >
        {MOCK_CAGES.map((cage) => (
          <option key={cage.id} value={cage.id}>
            {cage.name}
          </option>
        ))}
      </select>

      {/* Cage Metadata */}
      <div className="flex gap-4 items-center">
        <div className="text-right">
          <p className="text-xs text-muted">Capacity</p>
          <p className="font-semibold text-foreground">{selectedCage.currentOccupancy}/{selectedCage.maxCapacity}</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-right">
          <p className="text-xs text-muted">Weight Range</p>
          <p className="font-semibold text-foreground">{selectedCage.minWeight} - {selectedCage.maxWeight} kg</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-right">
          <p className="text-xs text-muted">Available Slots</p>
          <p className="font-semibold text-success">{selectedCage.maxCapacity - selectedCage.currentOccupancy}</p>
        </div>
      </div>
    </div>
  </div>
)

const BarcodeScanner = ({ onScan }: { onScan: (animal: Animal) => void }) => {
  const [scanInput, setScanInput] = useState('')
  const [scannedAnimal, setScannedAnimal] = useState<Animal | null>(null)
  const [newWeight, setNewWeight] = useState('')

  const handleScan = () => {
    // Simulate barcode scanning
    const found = MOCK_ANIMALS.find((a) => a.barcodeId === scanInput)
    if (found) {
      setScannedAnimal(found)
      setNewWeight('')
    } else {
      alert('Animal not found')
    }
    setScanInput('')
  }

  const handleWeightSubmit = () => {
    if (scannedAnimal && newWeight) {
      const updatedAnimal = {
        ...scannedAnimal,
        currentWeight: parseFloat(newWeight),
        lastUpdated: new Date().toISOString().split('T')[0],
      }
      onScan(updatedAnimal)
      setScannedAnimal(null)
      setNewWeight('')
    }
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Barcode Input */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3">Scan Barcode</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              placeholder="Enter barcode or scan with device..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-success transition-colors"
            />
          </div>
          <button
            onClick={handleScan}
            className="px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
          >
            Scan
          </button>
        </div>
      </div>

      {/* Active Scan Card */}
      {scannedAnimal && (
        <div className="bg-gradient-to-r from-success/10 to-primary/10 border border-success/30 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Active Scan
            </h3>
            <button
              onClick={() => {
                setScannedAnimal(null)
                setNewWeight('')
              }}
              className="text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted mb-1">Barcode ID</p>
              <p className="font-mono font-semibold text-foreground">{scannedAnimal.barcodeId}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Mother ID</p>
              <p className="font-mono text-sm text-muted">{scannedAnimal.motherId || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Father ID</p>
              <p className="font-mono text-sm text-muted">{scannedAnimal.fatherId || 'Unknown'}</p>
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-muted mb-2">Current Weight: {scannedAnimal.currentWeight} kg</label>
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Enter new weight (kg)"
                className="w-full px-3 py-2 bg-background/50 border border-success/50 rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-success transition-colors"
              />
            </div>
            <button
              onClick={handleWeightSubmit}
              disabled={!newWeight}
              className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Weight className="w-4 h-4" />
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const StatusBadgeCustom = ({ status }: { status: 'healthy' | 'sick' | 'pending' }) => {
  const styles = {
    healthy: 'bg-green-500/20 text-green-400',
    sick: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
  }
  const labels = {
    healthy: 'Healthy',
    sick: 'Sick',
    pending: 'Pending',
  }

  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{labels[status]}</span>
}

const SexIcon = ({ sex }: { sex: 'M' | 'F' }) => (
  <span className={`inline-block w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${sex === 'M' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
    {sex}
  </span>
)

const SuggestedMovementsModal = ({
  isOpen,
  movements,
  onClose,
}: {
  isOpen: boolean
  movements: SuggestedMovement[]
  onClose: () => void
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 max-w-2xl max-h-96 overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-success" />
            Suggested Movements
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {movements.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted">
              <p>No movements needed at this time.</p>
            </div>
          ) : (
            movements.map((movement) => (
              <div key={movement.animalId} className="bg-background border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-mono font-semibold text-foreground">{movement.barcodeId}</p>
                    <p className="text-xs text-muted">{movement.weightClass}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${WEIGHT_CLASSES.find((w) => w.target === movement.recommendedCage)?.color}`}>
                    {movement.weightClass}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted mb-1">Previous</p>
                    <p className="font-semibold text-foreground">{movement.currentWeight} kg</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted mb-1">New</p>
                    <p className="font-semibold text-success">{movement.newWeight} kg</p>
                  </div>

                  <div className="w-px h-8 bg-border" />

                  <div>
                    <p className="text-xs text-muted mb-1">From</p>
                    <p className="font-semibold text-foreground">{movement.oldCage}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted mb-1">To</p>
                    <p className="font-semibold text-success">{movement.recommendedCage}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 flex gap-3 text-sm">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">Automated Sorting will:</p>
            <ul className="text-blue-300 text-xs mt-1 ml-0 space-y-1">
              <li>• Move animals to weight-appropriate cages</li>
              <li>• Ensure capacity limits are respected</li>
              <li>• Optimize resource utilization</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground font-medium hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-2.5 bg-success text-white rounded-lg font-medium hover:bg-success/90 transition-colors">
            Confirm & Execute
          </button>
        </div>
      </div>
    </div>
  )
}

const RulesLegend = () => (
  <div className="bg-surface border border-border rounded-xl p-5 mb-6">
    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
      <BarChart3 className="w-4 h-4 text-success" />
      Weight Classification Rules
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {WEIGHT_CLASSES.map((rule, idx) => (
        <div key={idx} className={`rounded-lg p-3 ${rule.color}`}>
          <p className="text-xs font-medium mb-1">{rule.range}</p>
          <p className="text-sm font-semibold">{rule.target}</p>
        </div>
      ))}
    </div>
  </div>
)

// Main Component
export const CageMonitoring = () => {
  const [selectedCage, setSelectedCage] = useState<Cage>(MOCK_CAGES[0])
  const [animals, setAnimals] = useState<Animal[]>(MOCK_ANIMALS)
  const [showSuggestedMovements, setShowSuggestedMovements] = useState(false)
  const [suggestedMovements, setSuggestedMovements] = useState<SuggestedMovement[]>([])

  const filteredAnimals = animals

  const getWeightClass = (weight: number): string => {
    if (weight < 25) return '< 25 kg'
    if (weight < 50) return '25 - 50 kg'
    if (weight < 100) return '50 - 100 kg'
    return '> 100 kg'
  }

  const handleSort = () => {
    // Generate suggested movements
    const movements: SuggestedMovement[] = filteredAnimals.map((animal) => {
      const weightClass = getWeightClass(animal.currentWeight)
      const targetCage = WEIGHT_CLASSES.find((w) => w.range === weightClass)?.target || 'Cage A-101'

      return {
        animalId: animal.id,
        barcodeId: animal.barcodeId,
        currentWeight: animal.currentWeight,
        newWeight: animal.currentWeight + 0.5, // Simulated new weight
        oldCage: selectedCage.name,
        recommendedCage: targetCage,
        weightClass,
      }
    })

    setSuggestedMovements(movements)
    setShowSuggestedMovements(true)
  }

  const handleScanComplete = (updatedAnimal: Animal) => {
    setAnimals((prev) => prev.map((a) => (a.id === updatedAnimal.id ? updatedAnimal : a)))
    // Show success toast in real implementation
    alert(`Weight updated for ${updatedAnimal.barcodeId}`)
  }

  const getWeightTrend = (history: number[]): ReactNode => {
    if (history.length < 2) return null
    const min = Math.min(...history)
    const max = Math.max(...history)
    const isDeclining = history[history.length - 1] < history[0]

    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted">{min.toFixed(1)}</span>
        <div className="flex gap-0.5">
          {history.map((h, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-success to-success/50"
              style={{ height: `${((h - min) / (max - min)) * 20 + 4}px` }}
            />
          ))}
        </div>
        <span className="text-xs text-muted">{max.toFixed(1)}</span>
        {isDeclining && <TrendingUp className="w-3 h-3 text-warning -rotate-180" />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div>
          <UserContext />
          <Breadcrumb />
          <PageHeader
            title="Cage Monitoring"
            subtitle="Manage animal allocation based on weight classification and cage capacity"
            icon={<Scan className="w-6 h-6" />}
          />
        </div>

        {/* Stats Row */}
        <StatsRow>
          <StatCard label="Total Animals" value={filteredAnimals.length} color="default" />
          <StatCard label="Healthy" value={filteredAnimals.filter((a) => a.status === 'healthy').length} color="success" />
          <StatCard label="Needing Attention" value={filteredAnimals.filter((a) => a.status !== 'healthy').length} color="warning" />
          <StatCard label="Cage Occupancy" value={`${selectedCage.currentOccupancy}/${selectedCage.maxCapacity}`} color="default" />
        </StatsRow>

        {/* Cage Selector */}
        <CageSelector selectedCage={selectedCage} onCageChange={setSelectedCage} />

        {/* Barcode Scanner */}
        <BarcodeScanner onScan={handleScanComplete} />

        {/* Rules Legend & Action Bar */}
        <RulesLegend />

        <ActionsBar>
          <button
            onClick={handleSort}
            className="flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 active:scale-95 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
            Sort & Reassign
          </button>
        </ActionsBar>

        {/* Main Monitoring Table */}
        <DataTable
          data={filteredAnimals}
          title="Animals in Cage"
          titleIcon={<Dna className="w-5 h-5" />}
          columns={[
            {
              key: 'barcodeId',
              header: 'Barcode ID',
              render: (item) => <span className="font-mono font-semibold text-foreground">{item.barcodeId}</span>,
            },
            {
              key: 'sex',
              header: 'Sex',
              render: (item) => <SexIcon sex={item.sex} />,
              className: 'w-16 text-center',
            },
            {
              key: 'currentWeight',
              header: 'Current Weight',
              render: (item) => (
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{item.currentWeight.toFixed(2)} kg</span>
                  {getWeightTrend(item.weightHistory)}
                </div>
              ),
            },
            {
              key: 'lastUpdated',
              header: 'Last Updated',
              render: (item) => (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Clock className="w-4 h-4" />
                  {item.lastUpdated}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) => <StatusBadgeCustom status={item.status} />,
              className: 'text-center',
            },
            {
              key: 'actions',
              header: 'Action',
              render: () => (
                <button className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-medium rounded hover:bg-primary/30 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                  <Weight className="w-3.5 h-3.5" />
                  Weigh Now
                </button>
              ),
              className: 'text-center',
            },
          ]}
          emptyMessage="No animals found in this cage."
        />

        {/* Suggested Movements Modal */}
        <SuggestedMovementsModal
          isOpen={showSuggestedMovements}
          movements={suggestedMovements}
          onClose={() => setShowSuggestedMovements(false)}
        />
      </div>
    </div>
  )
}

export default CageMonitoring
