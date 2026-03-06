import { useState, useEffect } from 'react';
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
  is_filled: boolean;
}

const PositionDialog = ({
  open,
  onClose,
  onSubmit,
  position,
  isLoading = false,
}: PositionDialogProps) => {
  const [itemNo, setItemNo] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [salaryRateId, setSalaryRateId] = useState('');
  const [positionTypeId, setPositionTypeId] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [isFilled, setIsFilled] = useState(false);

  const [offices, setOffices] = useState<Office[]>([]);
  const [salaryRates, setSalaryRates] = useState<SalaryRate[]>([]);
  const [positionTypes, setPositionTypes] = useState<PositionType[]>([]);
  const [loadingData, setLoadingData] = useState(false);

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
      // Note: We can't restore sr_id and pt_id from PlantillaPosition
      // as they're not stored there. For edit mode, we'd need to fetch them.
      setOfficeId(position.office_id);
      setIsFilled(position.is_filled);
    } else {
      // Reset form for new position
      resetForm();
    }
  }, [position]);

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
    setSalaryRateId('');
    setPositionTypeId('');
    setOfficeId('');
    setIsFilled(false);
  };

  const handleSubmit = () => {
    const positionData: PositionFormData = {
      item_no: itemNo.trim(),
      description: positionTitle.trim(),
      sr_id: salaryRateId,
      pt_id: positionTypeId,
      o_id: officeId,
      is_filled: isFilled,
    };

    onSubmit(positionData);
  };

  const isFormValid = () => {
    return (
      itemNo.trim() !== '' &&
      positionTitle.trim() !== '' &&
      salaryRateId !== '' &&
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
          label="Item No."
          placeholder="e.g., MO-001, HRMO-001"
          value={itemNo}
          onChange={setItemNo}
          required
        />

        {/* Position Title */}
        <FormInput
          id="position-title"
          label="Position Title"
          placeholder="e.g., Municipal Planning and Development Coordinator"
          value={positionTitle}
          onChange={setPositionTitle}
          required
        />

        {/* Salary Rate Selector */}
        <div className="space-y-1.5">
          <label htmlFor="salary-rate" className="block text-sm font-medium text-foreground">
            Salary Rate
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="salary-rate"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={salaryRateId}
            onChange={(e) => setSalaryRateId(e.target.value)}
            required
            disabled={loadingData}
          >
            <option value="">-- Select salary rate --</option>
            {salaryRates.map((rate) => (
              <option key={rate.id} value={rate.id}>
                {rate.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">Select the appropriate salary grade and step</p>
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
