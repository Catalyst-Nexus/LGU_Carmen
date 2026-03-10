import { useState, useEffect, useMemo } from 'react';
import { BaseDialog, FormInput } from '@/components/ui/dialog';
import type { PlantillaPosition } from '@/types/hr.types';
import type { Office, SalaryRate, PositionType } from '@/services/hrService';
import { fetchOffices, fetchSalaryRates, fetchPositionTypes } from '@/services/hrService';

interface PositionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (positionData: PositionFormData) => void;
  position?: PlantillaPosition | null;
  isLoading?: boolean;
}

export interface PositionFormData {
  item_no: string;
  description: string;
  sr_id: string;
  pt_id: string;
  o_id: string;
  authorization: string;
  is_filled: boolean;
  slots?: number;
}

const formatPeso = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const PositionDialog = ({
  open,
  onClose,
  onSubmit,
  position,
  isLoading = false,
}: PositionDialogProps) => {
  const [itemNo, setItemNo] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [selectedSG, setSelectedSG] = useState('');
  const [selectedStep, setSelectedStep] = useState('');
  const [positionTypeId, setPositionTypeId] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [authorization, setAuthorization] = useState('');
  const [isFilled, setIsFilled] = useState(false);
  const [slots, setSlots] = useState(1);

  const [offices, setOffices] = useState<Office[]>([]);
  const [salaryRates, setSalaryRates] = useState<SalaryRate[]>([]);
  const [positionTypes, setPositionTypes] = useState<PositionType[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Derive unique SG numbers from data
  const availableSGs = useMemo(() => {
    const sgs = new Set<number>();
    for (const sr of salaryRates) {
      if (sr.sg_number !== null) sgs.add(sr.sg_number);
    }
    return Array.from(sgs).sort((a, b) => a - b);
  }, [salaryRates]);

  // Derive available steps for selected SG
  const availableSteps = useMemo(() => {
    if (!selectedSG) return [];
    const sg = Number(selectedSG);
    return salaryRates
      .filter(sr => sr.sg_number === sg && sr.step !== null)
      .sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
  }, [salaryRates, selectedSG]);

  // Resolve the salary_rate row from SG + Step
  const resolvedRate = useMemo(() => {
    if (!selectedSG || !selectedStep) return null;
    const sg = Number(selectedSG);
    const step = Number(selectedStep);
    return salaryRates.find(sr => sr.sg_number === sg && sr.step === step) ?? null;
  }, [salaryRates, selectedSG, selectedStep]);

  // Preview slot item numbers
  const slotPreview = useMemo(() => {
    if (!position && slots > 1 && itemNo.trim()) {
      const lastDash = itemNo.lastIndexOf('-');
      if (lastDash === -1) return null;
      const prefix = itemNo.substring(0, lastDash);
      const numStr = itemNo.substring(lastDash + 1);
      const num = parseInt(numStr, 10);
      if (isNaN(num) || !prefix) return null;
      return Array.from({ length: slots }, (_, i) =>
        `${prefix}-${String(num + i).padStart(numStr.length, '0')}`
      );
    }
    return null;
  }, [position, slots, itemNo]);

  // Load dropdown data
  useEffect(() => {
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (position) {
      setItemNo(position.item_number);
      setPositionTitle(position.position_title);
      setOfficeId(position.office_id);
      setIsFilled(position.is_filled);
    } else {
      resetForm();
    }
  }, [position]);

  // Auto-select Step 1 when SG changes
  useEffect(() => {
    if (availableSteps.length > 0) {
      setSelectedStep(String(availableSteps[0].step));
    } else {
      setSelectedStep('');
    }
  }, [selectedSG, availableSteps.length]);

  const loadDropdownData = async () => {
    setLoadingData(true);
    const [officesData, salaryRatesData, positionTypesData] = await Promise.all([
      fetchOffices(),
      fetchSalaryRates(),
      fetchPositionTypes(),
    ]);
    setOffices(officesData);
    setSalaryRates(salaryRatesData);
    setPositionTypes(positionTypesData);
    setLoadingData(false);
  };

  const resetForm = () => {
    setItemNo('');
    setPositionTitle('');
    setSelectedSG('');
    setSelectedStep('');
    setPositionTypeId('');
    setOfficeId('');
    setAuthorization('');
    setIsFilled(false);
    setSlots(1);
  };

  const handleSubmit = () => {
    if (!resolvedRate) return;
    const positionData: PositionFormData = {
      item_no: itemNo.trim(),
      description: positionTitle.trim(),
      sr_id: resolvedRate.id,
      pt_id: positionTypeId,
      o_id: officeId,
      authorization: authorization.trim(),
      is_filled: isFilled,
      ...((!position && slots > 1) ? { slots } : {}),
    };
    onSubmit(positionData);
  };

  const isFormValid = () => {
    return (
      itemNo.trim() !== '' &&
      positionTitle.trim() !== '' &&
      resolvedRate !== null &&
      positionTypeId !== '' &&
      officeId !== ''
    );
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={position ? 'Edit Position' : 'Add New Position'}
      onSubmit={handleSubmit}
      submitLabel={position ? 'Save Changes' : 'Add Position'}
      isLoading={isLoading || loadingData}
    >
      <div className="space-y-4">
        {/* Item Number */}
        <FormInput
          id="item-no"
          label={!position && slots > 1 ? "Starting Item No." : "Item No."}
          placeholder="e.g., MO-001, HRMO-001"
          value={itemNo}
          onChange={setItemNo}
          required
        />

        {/* Number of Slots — only when adding */}
        {!position && (
          <div className="space-y-1.5">
            <label htmlFor="slots" className="block text-sm font-medium text-foreground">
              Number of Slots
            </label>
            <input
              id="slots"
              type="number"
              min={1}
              max={50}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={slots}
              onChange={(e) => setSlots(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
            {slotPreview && slotPreview.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Will create: {slotPreview.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Position Title */}
        <FormInput
          id="position-title"
          label="Position Title"
          placeholder="e.g., Municipal Planning and Development Coordinator"
          value={positionTitle}
          onChange={setPositionTitle}
          required
        />

        {/* Salary Grade + Step (side by side) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Salary Grade & Step
            <span className="text-error ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              id="salary-grade"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={selectedSG}
              onChange={(e) => setSelectedSG(e.target.value)}
              required
              disabled={loadingData}
            >
              <option value="">-- SG --</option>
              {availableSGs.map((sg) => (
                <option key={sg} value={sg}>
                  SG-{sg}
                </option>
              ))}
            </select>
            <select
              id="salary-step"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={selectedStep}
              onChange={(e) => setSelectedStep(e.target.value)}
              required
              disabled={loadingData || !selectedSG}
            >
              <option value="">-- Step --</option>
              {availableSteps.map((sr) => (
                <option key={sr.step} value={sr.step!}>
                  Step {sr.step}
                </option>
              ))}
            </select>
          </div>
          {resolvedRate && (
            <p className="text-xs text-success font-medium">
              Monthly: {formatPeso(resolvedRate.amount)}
            </p>
          )}
          {!resolvedRate && selectedSG && selectedStep && (
            <p className="text-xs text-error">No matching salary rate found</p>
          )}
        </div>

        {/* Position Type Selector */}
        <div className="space-y-1.5">
          <label htmlFor="position-type" className="block text-sm font-medium text-foreground">
            Position Type
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="position-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={positionTypeId}
            onChange={(e) => setPositionTypeId(e.target.value)}
            required
            disabled={loadingData}
          >
            <option value="">-- Select position type --</option>
            {positionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.description}
              </option>
            ))}
          </select>
        </div>

        {/* Office Selector */}
        <div className="space-y-1.5">
          <label htmlFor="office" className="block text-sm font-medium text-foreground">
            Office
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="office"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={officeId}
            onChange={(e) => setOfficeId(e.target.value)}
            required
            disabled={loadingData}
          >
            <option value="">-- Select an office --</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.description}
              </option>
            ))}
          </select>
        </div>

        {/* Authorization / Legal Basis */}
        <FormInput
          id="authorization"
          label="Authorization"
          placeholder="e.g., SB Ord. No. 2024-015 or RA 11466"
          value={authorization}
          onChange={setAuthorization}
        />

        {/* Status (Filled/Vacant) */}
        <div className="flex items-center gap-2">
          <input
            id="is-filled"
            type="checkbox"
            className="w-4 h-4 border border-border rounded text-success focus:ring-success"
            checked={isFilled}
            onChange={(e) => setIsFilled(e.target.checked)}
          />
          <label htmlFor="is-filled" className="text-sm font-medium text-foreground">
            Position is Filled
          </label>
        </div>

        {!isFormValid() && (
          <p className="text-xs text-error">
            * Please fill in all required fields
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default PositionDialog;
