import { useState, useEffect } from "react";
import { BaseDialog, FormInput } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import type {
  PurchaseRequestFormData,
  PurchaseRequestListFormData,
  Item,
  Unit,
} from "@/types/gse.types";
import {
  createPurchaseRequest,
  updatePurchaseRequest,
  addPurchaseRequestItem,
  generatePRNumber,
  fetchItems,
  fetchUnits,
  fetchResponsibilityCenters,
  fetchResponsibilityCenterSections,
  type ResponsibilityCenter,
  type ResponsibilityCenterSection,
} from "@/services/gseService";

interface PurchaseRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pr_id?: string;
  mode: "create" | "edit";
}

interface PRItem extends PurchaseRequestListFormData {
  tempId: string;
}

const PurchaseRequestDialog = ({
  isOpen,
  onClose,
  onSuccess,
  pr_id,
  mode,
}: PurchaseRequestDialogProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [responsibilityCenters, setResponsibilityCenters] = useState<ResponsibilityCenter[]>([]);
  const [responsibilityCenterSections, setResponsibilityCenterSections] = useState<ResponsibilityCenterSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [prItems, setPrItems] = useState<PRItem[]>([]);

  const [formData, setFormData] = useState<PurchaseRequestFormData>({
    pr_no: "",
    pr_date: new Date().toISOString().split("T")[0],
    rc_id: "",
    rcs_id: null,
    purpose: "",
    remarks: null,
    requested_by: null,
  });

  useEffect(() => {
    const loadData = async () => {
      const [itemsData, unitsData, rcData, prNo] = await Promise.all([
        fetchItems(),
        fetchUnits(),
        fetchResponsibilityCenters(),
        mode === "create" ? generatePRNumber() : Promise.resolve(""),
      ]);

      setItems(itemsData);
      setUnits(unitsData);
      setResponsibilityCenters(rcData);

      if (mode === "create") {
        setFormData((prev) => ({ ...prev, pr_no: prNo }));
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, mode]);

  // Load sections when RC changes
  useEffect(() => {
    const loadSections = async () => {
      if (formData.rc_id) {
        const sections = await fetchResponsibilityCenterSections(formData.rc_id);
        setResponsibilityCenterSections(sections);
      } else {
        setResponsibilityCenterSections([]);
        setFormData((prev) => ({ ...prev, rcs_id: null }));
      }
    };

    loadSections();
  }, [formData.rc_id]);

  const handleAddItem = () => {
    setPrItems([
      ...prItems,
      {
        tempId: `temp-${Date.now()}`,
        i_id: "",
        u_id: "",
        qty: 1,
        unit_price_estimated: 0,
        specifications: null,
      },
    ]);
  };

  const handleRemoveItem = (tempId: string) => {
    setPrItems(prItems.filter((item) => item.tempId !== tempId));
  };

  const handleItemChange = (
    tempId: string,
    field: keyof PurchaseRequestListFormData,
    value: any
  ) => {
    setPrItems(
      prItems.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (mode === "create") {
        const result = await createPurchaseRequest(formData);
        if (result.success && result.pr_id) {
          // Add items
          for (const item of prItems) {
            await addPurchaseRequestItem(result.pr_id, {
              i_id: item.i_id,
              u_id: item.u_id,
              qty: item.qty,
              unit_price_estimated: item.unit_price_estimated,
              specifications: item.specifications,
            });
          }
          onSuccess();
          onClose();
        }
      } else if (pr_id) {
        await updatePurchaseRequest(pr_id, formData);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error saving purchase request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseDialog
      open={isOpen}
      onClose={onClose}
      title={`${mode === "create" ? "Create New" : "Edit"} Purchase Request`}
      onSubmit={handleSubmit}
      submitLabel={mode === "create" ? "Create" : "Update"}
      isLoading={loading}
      size="xl"
    >
      <div className="space-y-6 max-h-[60vh] overflow-y-auto px-5">
        {/* Header Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              PR Number <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.pr_no}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-gray-100 text-foreground"
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Requesting Entity/Office <span className="text-error">*</span>
            </label>
            <select
              value={formData.rc_id}
              onChange={(e) =>
                setFormData({ ...formData, rc_id: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              required
            >
              <option value="">Select Responsibility Center</option>
              {responsibilityCenters.map((rc) => (
                <option key={rc.id} value={rc.id}>
                  {rc.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Section (Optional)
            </label>
            <select
              value={formData.rcs_id || ""}
              onChange={(e) =>
                setFormData({ ...formData, rcs_id: e.target.value || null })
              }
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              disabled={!formData.rc_id || responsibilityCenterSections.length === 0}
            >
              <option value="">Select Section (Optional)</option>
              {responsibilityCenterSections.map((rcs) => (
                <option key={rcs.id} value={rcs.id}>
                  {rcs.description}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Purpose <span className="text-error">*</span>
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              rows={3}
              placeholder="For Agusan del Norte Provincial Health Office-Full implementation of IROMIs = (Clinical Wards) IM&"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              Remarks
            </label>
            <textarea
              value={formData.remarks || ""}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value || null })
              }
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              rows={2}
            />
          </div>

          <FormInput
            id="requested_by"
            label="Requested By"
            value={formData.requested_by || ""}
            onChange={(val) =>
              setFormData({ ...formData, requested_by: val || null })
            }
            placeholder="Name of requester"
          />
        </div>

        {/* Items Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-foreground">Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm font-medium hover:bg-success/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Item Description
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Unit
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Unit Cost (Est.)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Amount (Est.)
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                      Specifications
                    </th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prItems.map((item, index) => {
                    const totalAmount = item.qty * item.unit_price_estimated;
                    return (
                      <tr key={item.tempId}>
                        <td className="px-3 py-2 text-sm">{index + 1}</td>
                        <td className="px-3 py-2">
                          <select
                            value={item.i_id}
                            onChange={(e) =>
                              handleItemChange(
                                item.tempId,
                                "i_id",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                            required
                          >
                            <option value="">Select Item</option>
                            {items.map((i) => (
                              <option key={i.i_id} value={i.i_id}>
                                {i.description}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.u_id}
                            onChange={(e) =>
                              handleItemChange(
                                item.tempId,
                                "u_id",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                            required
                          >
                            <option value="">Unit</option>
                            {units.map((u) => (
                              <option key={u.u_id} value={u.u_id}>
                                {u.description}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(
                                item.tempId,
                                "qty",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                            min="0.001"
                            step="0.001"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.unit_price_estimated}
                            onChange={(e) =>
                              handleItemChange(
                                item.tempId,
                                "unit_price_estimated",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                            min="0"
                            step="0.01"
                            required
                          />
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
                          ₱
                          {totalAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.specifications || ""}
                            onChange={(e) =>
                              handleItemChange(
                                item.tempId,
                                "specifications",
                                e.target.value || null
                              )
                            }
                            className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                            placeholder="Additional specs..."
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.tempId)}
                            className="p-1.5 rounded transition-colors text-muted hover:text-danger hover:bg-danger/10"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {prItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-8 text-center text-sm text-muted"
                      >
                        No items added yet. Click "Add Item" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
                {prItems.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-2 text-right text-sm font-semibold"
                      >
                        TOTAL:
                      </td>
                      <td className="px-3 py-2 text-sm font-bold text-primary">
                        ₱
                        {prItems
                          .reduce(
                            (sum, item) =>
                              sum + item.qty * item.unit_price_estimated,
                            0
                          )
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default PurchaseRequestDialog;
