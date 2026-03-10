import { useState, useEffect } from "react";
import { BaseDialog, FormInput } from "@/components/ui/dialog";
import type {
  PurchaseRequest,
  PurchaseRequestFormData,
  ResponsibilityCenter,
  ResponsibilityCenterSection,
} from "@/types/gse.types";
import {
  fetchResponsibilityCenters,
  fetchSections,
} from "@/services/gseService";

interface PurchaseRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseRequestFormData) => void;
  pr?: PurchaseRequest | null;
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

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-success uppercase tracking-wider pt-4 pb-1 border-b border-border mb-3">
    {children}
  </h3>
);

const PurchaseRequestDialog = ({
  open,
  onClose,
  onSubmit,
  pr,
  isLoading = false,
}: PurchaseRequestDialogProps) => {
  const [prDate, setPrDate] = useState("");
  const [rcId, setRcId] = useState("");
  const [rcsId, setRcsId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [requestedBy, setRequestedBy] = useState("");

  const [centers, setCenters] = useState<ResponsibilityCenter[]>([]);
  const [sections, setSections] = useState<ResponsibilityCenterSection[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) loadDropdowns();
  }, [open]);

  useEffect(() => {
    if (pr) {
      setPrDate(pr.pr_date);
      setRcId(pr.rc_id);
      setRcsId(pr.rcs_id || "");
      setPurpose(pr.purpose);
      setRemarks(pr.remarks || "");
      setRequestedBy(pr.requested_by || "");
    } else {
      resetForm();
    }
  }, [pr]);

  // reload sections when responsibility center changes
  useEffect(() => {
    if (rcId) {
      fetchSections(rcId).then(setSections);
    } else {
      setSections([]);
      setRcsId("");
    }
  }, [rcId]);

  const loadDropdowns = async () => {
    setLoadingData(true);
    const centersData = await fetchResponsibilityCenters();
    setCenters(centersData);
    setLoadingData(false);
  };

  const resetForm = () => {
    setPrDate(new Date().toISOString().slice(0, 10));
    setRcId("");
    setRcsId("");
    setPurpose("");
    setRemarks("");
    setRequestedBy("");
  };

  const handleSubmit = () => {
    onSubmit({
      pr_date: prDate,
      rc_id: rcId,
      rcs_id: rcsId,
      purpose: purpose.trim(),
      remarks: remarks.trim(),
      requested_by: requestedBy.trim(),
    });
  };

  const isFormValid = rcId !== "" && purpose.trim() !== "" && prDate !== "";

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={pr ? "Edit Purchase Request" : "New Purchase Request"}
      onSubmit={handleSubmit}
      submitLabel={pr ? "Save Changes" : "Create PR"}
      isLoading={isLoading || loadingData}
      size="lg"
    >
      <div className="space-y-1">
        <SectionHeading>PR Details</SectionHeading>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PR Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="pr-date"
              className="block text-sm font-medium text-foreground"
            >
              PR Date <span className="text-error ml-1">*</span>
            </label>
            <input
              id="pr-date"
              type="date"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={prDate}
              onChange={(e) => setPrDate(e.target.value)}
              required
            />
          </div>

          <FormInput
            id="requested-by"
            label="Requested By"
            placeholder="Name of requesting officer"
            value={requestedBy}
            onChange={setRequestedBy}
          />
        </div>

        <SectionHeading>Responsibility Center</SectionHeading>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect
            id="rc"
            label="Office / Responsibility Center"
            value={rcId}
            onChange={setRcId}
            required
            disabled={loadingData}
          >
            <option value="">-- Select Office --</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.rc_code} — {c.description}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            id="rcs"
            label="Section (optional)"
            value={rcsId}
            onChange={setRcsId}
            disabled={!rcId || sections.length === 0}
          >
            <option value="">-- None --</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.rcs_code} — {s.description}
              </option>
            ))}
          </FormSelect>
        </div>

        <SectionHeading>Purpose &amp; Remarks</SectionHeading>

        <FormInput
          id="purpose"
          label="Purpose"
          placeholder="Purpose of the purchase request"
          value={purpose}
          onChange={setPurpose}
          type="textarea"
          rows={3}
          required
        />

        <div className="mt-4">
          <FormInput
            id="remarks"
            label="Remarks"
            placeholder="Additional remarks (optional)"
            value={remarks}
            onChange={setRemarks}
            type="textarea"
            rows={2}
          />
        </div>

        {!isFormValid && (
          <p className="text-xs text-error mt-3">
            * Please fill in all required fields (date, office, purpose)
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default PurchaseRequestDialog;
