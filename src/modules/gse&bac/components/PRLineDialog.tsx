import { useState, useEffect } from "react";
import { BaseDialog, FormInput } from "@/components/ui/dialog";
import type {
  PurchaseRequestLine,
  PRLineFormData,
  Item,
  Unit,
} from "@/types/gse.types";
import { fetchItems, fetchUnits } from "@/services/gseService";

interface PRLineDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PRLineFormData) => void;
  line?: PurchaseRequestLine | null;
  isLoading?: boolean;
}

const FormSelect = ({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
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
);

const PRLineDialog = ({
  open,
  onClose,
  onSubmit,
  line,
  isLoading = false,
}: PRLineDialogProps) => {
  const [itemId, setItemId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [specifications, setSpecifications] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) loadDropdowns();
  }, [open]);

  useEffect(() => {
    if (line) {
      setItemId(line.i_id);
      setUnitId(line.u_id);
      setQty(String(line.qty));
      setUnitPrice(String(line.unit_price_estimated));
      setSpecifications(line.specifications || "");
    } else {
      resetForm();
    }
  }, [line]);

  // auto-fill default unit when item changes
  useEffect(() => {
    if (!line && itemId) {
      const selected = items.find((i) => i.id === itemId);
      if (selected?.default_u_id) {
        setUnitId(selected.default_u_id);
      }
    }
  }, [itemId, items, line]);

  const loadDropdowns = async () => {
    setLoadingData(true);
    const [itemsData, unitsData] = await Promise.all([
      fetchItems(),
      fetchUnits(),
    ]);
    setItems(itemsData);
    setUnits(unitsData);
    setLoadingData(false);
  };

  const resetForm = () => {
    setItemId("");
    setUnitId("");
    setQty("");
    setUnitPrice("");
    setSpecifications("");
  };

  const handleSubmit = () => {
    onSubmit({
      i_id: itemId,
      u_id: unitId,
      qty: parseFloat(qty),
      unit_price_estimated: parseFloat(unitPrice),
      specifications: specifications.trim(),
    });
  };

  const parsedQty = parseFloat(qty) || 0;
  const parsedPrice = parseFloat(unitPrice) || 0;
  const lineTotal = parsedQty * parsedPrice;

  const isFormValid =
    itemId !== "" && unitId !== "" && parsedQty > 0 && parsedPrice >= 0;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={line ? "Edit Line Item" : "Add Line Item"}
      onSubmit={handleSubmit}
      submitLabel={line ? "Save Changes" : "Add Item"}
      isLoading={isLoading || loadingData}
      size="md"
    >
      <div className="space-y-4">
        <FormSelect
          id="item"
          label="Item"
          value={itemId}
          onChange={setItemId}
          required
          disabled={loadingData}
        >
          <option value="">-- Select Item --</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.i_code} — {i.description}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          id="unit"
          label="Unit of Measure"
          value={unitId}
          onChange={setUnitId}
          required
          disabled={loadingData}
        >
          <option value="">-- Select Unit --</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.u_code} — {u.description}
            </option>
          ))}
        </FormSelect>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="qty"
              className="block text-sm font-medium text-foreground"
            >
              Quantity <span className="text-error ml-1">*</span>
            </label>
            <input
              id="qty"
              type="number"
              min="0.001"
              step="0.001"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="unit-price"
              className="block text-sm font-medium text-foreground"
            >
              Est. Unit Price <span className="text-error ml-1">*</span>
            </label>
            <input
              id="unit-price"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {parsedQty > 0 && parsedPrice > 0 && (
          <p className="text-sm text-muted">
            Line Total:{" "}
            <span className="font-semibold text-foreground">
              ₱{lineTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
          </p>
        )}

        <FormInput
          id="specifications"
          label="Specifications"
          placeholder="Additional specs (optional)"
          value={specifications}
          onChange={setSpecifications}
          type="textarea"
          rows={2}
        />

        {!isFormValid && (
          <p className="text-xs text-error mt-2">
            * Please select an item, unit, and enter a valid quantity
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default PRLineDialog;
