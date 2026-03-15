import { useState, useEffect, useCallback } from "react";
import { BaseDialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui";
import { Plus, Trash2, RefreshCw, Download } from "lucide-react";
import {
  fetchAllHolidays,
  addHoliday,
  deleteHoliday,
  upsertHolidays,
} from "@/services/hrService";
import type { PhHoliday } from "@/services/hrService";

interface HolidayManagerDialogProps {
  open: boolean;
  onClose: () => void;
}

// Nager.Date public API — no key required, CORS-enabled
const NAGER_API = "https://date.nager.at/api/v3/PublicHolidays";

interface NagerHoliday {
  date: string;
  name: string;
  localName: string;
  types: string[]; // e.g. ["Public"] or ["Public", "Optional"]
}

interface ImportRow extends NagerHoliday {
  type: PhHoliday["type"];
  selected: boolean;
}

const TYPE_LABEL: Record<PhHoliday["type"], string> = {
  regular: "Regular",
  special_non_working: "Special Non-Working",
  special_working: "Special Working",
};

const TYPE_BADGE: Record<PhHoliday["type"], string> = {
  regular: "bg-danger/10 text-danger",
  special_non_working: "bg-warning/10 text-warning",
  special_working: "bg-success/10 text-success",
};

const YEAR_OPTIONS = (base: number) => [base - 1, base, base + 1, base + 2];

const HolidayManagerDialog = ({ open, onClose }: HolidayManagerDialogProps) => {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState("holidays");

  // ── "Holidays" tab ────────────────────────────────────────────────────────
  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState<PhHoliday[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add-holiday inline form
  const [addDate, setAddDate] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addType, setAddType] = useState<PhHoliday["type"]>("regular");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── "Import" tab ──────────────────────────────────────────────────────────
  const [importYear, setImportYear] = useState(currentYear);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [fetchingApi, setFetchingApi] = useState(false);
  const [importing, setImporting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const loadHolidays = useCallback(async () => {
    setLoadingList(true);
    const data = await fetchAllHolidays(year);
    setHolidays(data);
    setLoadingList(false);
  }, [year]);

  useEffect(() => {
    if (open) {
      loadHolidays();
      // Reset import tab state when dialog opens
      setImportRows([]);
      setApiError(null);
      setImportMessage(null);
    }
  }, [open, loadHolidays]);

  const handleAdd = async () => {
    if (!addDate || !addDesc.trim()) return;
    setAdding(true);
    setAddError(null);
    const result = await addHoliday({
      date: addDate,
      description: addDesc.trim(),
      type: addType,
    });
    setAdding(false);
    if (result.success) {
      setAddDate("");
      setAddDesc("");
      setAddType("regular");
      loadHolidays();
    } else {
      setAddError(result.error ?? "Failed to add holiday");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteHoliday(id);
    setDeletingId(null);
    loadHolidays();
  };

  const handleFetchFromApi = async () => {
    setFetchingApi(true);
    setApiError(null);
    setImportRows([]);
    setImportMessage(null);
    try {
      const res = await fetch(`${NAGER_API}/${importYear}/PH`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data: NagerHoliday[] = await res.json();
      setImportRows(
        data.map((h) => ({
          ...h,
          // Nager marks special/optional holidays with "Optional" in types
          type: h.types.includes("Optional")
            ? "special_non_working"
            : "regular",
          selected: true,
        })),
      );
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to fetch from API");
    } finally {
      setFetchingApi(false);
    }
  };

  const handleImport = async () => {
    const selected = importRows.filter((r) => r.selected);
    if (selected.length === 0) return;
    setImporting(true);
    setImportMessage(null);
    const result = await upsertHolidays(
      selected.map((r) => ({
        date: r.date,
        description: r.name,
        type: r.type,
      })),
    );
    setImporting(false);
    if (result.success) {
      setImportMessage(`${result.inserted} holiday(s) saved successfully.`);
      setImportRows([]);
      // Refresh holidays tab
      setYear(importYear);
      setActiveTab("holidays");
    } else {
      setApiError(result.error ?? "Import failed");
    }
  };

  const toggleAll = (checked: boolean) =>
    setImportRows((rows) => rows.map((r) => ({ ...r, selected: checked })));

  const selectedCount = importRows.filter((r) => r.selected).length;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Manage Philippine Holidays"
      onSubmit={onClose}
      submitLabel="Done"
      size="xl"
    >
      <Tabs
        tabs={[
          { id: "holidays", label: `${year} Holidays` },
          { id: "import", label: "Import from API" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ────────────────── HOLIDAYS TAB ────────────────── */}
      {activeTab === "holidays" && (
        <div className="mt-4 space-y-4">
          {/* Year selector + refresh */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Year:</label>
            <select
              className="px-3 py-1.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEAR_OPTIONS(currentYear).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={loadHolidays}
              disabled={loadingList}
              className="p-1.5 rounded-lg hover:bg-accent text-muted disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`}
              />
            </button>
            <span className="text-xs text-muted ml-auto">
              {holidays.length} holiday{holidays.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Holidays table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-accent/50 text-muted text-xs uppercase tracking-wide">
                  <th className="text-left px-3 py-2 w-28">Date</th>
                  <th className="text-left px-3 py-2">Description</th>
                  <th className="text-left px-3 py-2 w-44">Type</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-muted text-sm"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : holidays.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-muted text-sm"
                    >
                      No holidays found for {year}.
                    </td>
                  </tr>
                ) : (
                  holidays.map((h) => (
                    <tr
                      key={h.id}
                      className="border-t border-border hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-muted">
                        {h.date}
                      </td>
                      <td className="px-3 py-2">{h.description}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${TYPE_BADGE[h.type]}`}
                        >
                          {TYPE_LABEL[h.type]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDelete(h.id)}
                          disabled={deletingId === h.id}
                          className="p-1 rounded-lg hover:bg-danger/10 text-danger disabled:opacity-40 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add holiday inline form */}
          <div className="border border-border rounded-lg p-3 bg-accent/20 space-y-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">
              Add Holiday
            </p>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="space-y-1">
                <label className="text-xs text-muted">Date *</label>
                <input
                  type="date"
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-48 space-y-1">
                <label className="text-xs text-muted">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. City Foundation Day"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Type</label>
                <select
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                  value={addType}
                  onChange={(e) =>
                    setAddType(e.target.value as PhHoliday["type"])
                  }
                >
                  <option value="regular">Regular</option>
                  <option value="special_non_working">
                    Special Non-Working
                  </option>
                  <option value="special_working">Special Working</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={!addDate || !addDesc.trim() || adding}
                className="flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
            {addError && <p className="text-xs text-danger">{addError}</p>}
          </div>
        </div>
      )}

      {/* ────────────────── IMPORT TAB ────────────────── */}
      {activeTab === "import" && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted">
            Fetch official Philippine public holidays from the{" "}
            <span className="font-medium text-foreground">Nager.Date</span> open
            calendar API. Review each entry, adjust the type if needed, then
            import.
          </p>

          {/* Year + Fetch */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-foreground">Year:</label>
            <select
              className="px-3 py-1.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={importYear}
              onChange={(e) => {
                setImportYear(Number(e.target.value));
                setImportRows([]);
                setApiError(null);
                setImportMessage(null);
              }}
            >
              {YEAR_OPTIONS(currentYear).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={handleFetchFromApi}
              disabled={fetchingApi}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Download
                className={`w-4 h-4 ${fetchingApi ? "animate-bounce" : ""}`}
              />
              {fetchingApi ? "Fetching..." : `Fetch ${importYear} PH Calendar`}
            </button>
          </div>

          {apiError && (
            <p className="text-sm text-danger bg-danger/5 px-3 py-2 rounded-lg border border-danger/20">
              Error: {apiError}
            </p>
          )}

          {importMessage && (
            <p className="text-sm text-success bg-success/5 px-3 py-2 rounded-lg border border-success/20">
              {importMessage}
            </p>
          )}

          {importRows.length > 0 && (
            <div className="space-y-3">
              {/* Select all / count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {selectedCount} of {importRows.length} selected
                </span>
                <div className="flex items-center gap-3">
                  <button
                    className="text-xs text-primary underline"
                    onClick={() => toggleAll(true)}
                  >
                    Select All
                  </button>
                  <button
                    className="text-xs text-muted underline"
                    onClick={() => toggleAll(false)}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-accent">
                    <tr className="text-muted text-xs uppercase tracking-wide">
                      <th className="px-3 py-2 w-8"></th>
                      <th className="text-left px-3 py-2 w-28">Date</th>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-left px-3 py-2">Local Name</th>
                      <th className="text-left px-3 py-2 w-44">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((row, i) => (
                      <tr
                        key={row.date}
                        className={`border-t border-border transition-colors ${
                          row.selected
                            ? "hover:bg-accent/30"
                            : "opacity-50 hover:bg-accent/20"
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="accent-success"
                            checked={row.selected}
                            onChange={(e) => {
                              const updated = [...importRows];
                              updated[i] = {
                                ...row,
                                selected: e.target.checked,
                              };
                              setImportRows(updated);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted">
                          {row.date}
                        </td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2 text-muted text-xs">
                          {row.localName}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            className="w-full px-2 py-1 border border-border rounded text-xs bg-background text-foreground focus:outline-none focus:border-success"
                            value={row.type}
                            onChange={(e) => {
                              const updated = [...importRows];
                              updated[i] = {
                                ...row,
                                type: e.target.value as PhHoliday["type"],
                              };
                              setImportRows(updated);
                            }}
                          >
                            <option value="regular">Regular</option>
                            <option value="special_non_working">
                              Special Non-Working
                            </option>
                            <option value="special_working">
                              Special Working
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing
                  ? "Importing..."
                  : `Import ${selectedCount} Holiday${selectedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          )}

          {!fetchingApi && importRows.length === 0 && !apiError && (
            <div className="text-center py-10 text-muted text-sm border border-dashed border-border rounded-lg">
              Select a year and click{" "}
              <span className="font-medium">Fetch PH Calendar</span> to load
              holidays from the API.
            </div>
          )}
        </div>
      )}
    </BaseDialog>
  );
};

export default HolidayManagerDialog;
