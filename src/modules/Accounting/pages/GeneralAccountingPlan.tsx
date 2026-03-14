import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, ListChecks, Layers3, CheckCircle2 } from 'lucide-react';
import { PageHeader, ActionsBar, PrimaryButton, StatsRow, StatCard } from '@/components/ui';
import AccountingPlanList from '@/modules/Accounting/components/AccountingPlanList';
import AccountingPlanDialog from '@/modules/Accounting/components/AccountingPlanDialog';
import type { ExistingSubItem } from '@/modules/Accounting/components/AccountingPlanDialog';
import AccountingPlanRequestTab from '@/modules/Accounting/components/AccountingPlanRequestTab';
import {
  fetchPlans,
  createPlan,
  updatePlan,
  deletePlan,
  fetchPlanSubs,
  createPlanSub,
  updatePlanSub,
  deletePlanSub,
  createPlanRequest,
} from '@/services/accountingPlanService';
import type {
  GeneralAccountingPlan,
  GeneralAccountingPlanSub,
  AccountType,
} from '@/types/accounting.types';

type Tab = 'plans' | 'request';

const GeneralAccountingPlan = () => {
  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('plans');
  const [plans, setPlans] = useState<GeneralAccountingPlan[]>([]);
  const [planSearch, setPlanSearch] = useState('');
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<GeneralAccountingPlan | null>(null);
  const [planAccountyType, setPlanAccountyType] = useState<AccountType | ''>('');
  const [planDescription, setPlanDescription] = useState('');
  const [planHasSub, setPlanHasSub] = useState(false);
  const [planSubDescriptions, setPlanSubDescriptions] = useState<string[]>(['']);
  const [editingPlanSubs, setEditingPlanSubs] = useState<ExistingSubItem[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');

  // ── Sub state ─────────────────────────────────────────────────────────────
  const [subs, setSubs] = useState<GeneralAccountingPlanSub[]>([]);
  const [subSaving, setSubSaving] = useState(false);

  // ── Request state ─────────────────────────────────────────────────────────
  const [requestLoading, setRequestLoading] = useState(false);

  // ── Delete state ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<GeneralAccountingPlan | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteSubTarget, setDeleteSubTarget] = useState<GeneralAccountingPlanSub | null>(null);
  const [deleteSubConfirmOpen, setDeleteSubConfirmOpen] = useState(false);

  const totalPlans = plans.length;
  const activePlans = plans.filter((plan) => plan.status).length;
  const plansWithSubRecords = plans.filter((plan) => plan.has_sub).length;
  const totalSubRecords = subs.length;

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadPlans = useCallback(async () => { setPlans(await fetchPlans()); }, []);
  const loadSubs = useCallback(async () => { setSubs(await fetchPlanSubs()); }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => { loadSubs(); }, [loadSubs]);

  // ── Plan handlers ─────────────────────────────────────────────────────────
  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanAccountyType('');
    setPlanDescription('');
    setPlanHasSub(false);
    setPlanSubDescriptions(['']);
    setEditingPlanSubs([]);
    setPlanError('');
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: GeneralAccountingPlan) => {
    if (!plan.editable) return;
    setEditingPlan(plan);
    setPlanAccountyType(plan.accounty_type);
    setPlanDescription(plan.description);
    setPlanHasSub(plan.has_sub);
    setPlanSubDescriptions(['']);
    setEditingPlanSubs(
      subs
        .filter((s) => s.general_accounting_plan_id === plan.id)
        .map((s) => ({ id: s.id, description: s.description, editable: s.editable }))
    );
    setPlanError('');
    setPlanDialogOpen(true);
  };

  const handlePlanSubmit = async () => {
    if (!planAccountyType) { setPlanError('Account type is required.'); return; }
    if (!planDescription.trim()) { setPlanError('Description is required.'); return; }
    setPlanLoading(true);
    setPlanError('');
    const payload = {
      accounty_type: planAccountyType as AccountType,
      description: planDescription.trim(),
      has_sub: planHasSub,
      status: true,
      editable: true,
    };
    const nonEmptySubs = planHasSub ? planSubDescriptions.filter((d) => d.trim()) : [];

    if (editingPlan) {
      const updated = await updatePlan(editingPlan.id, payload);
      if (updated) {
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        // Update existing subs
        for (const sub of editingPlanSubs) {
          if (sub.editable) {
            const updatedSub = await updatePlanSub(sub.id, {
              description: sub.description,
              general_accounting_plan_id: updated.id,
              status: true,
              editable: true,
            });
            if (updatedSub) setSubs((prev) => prev.map((s) => (s.id === updatedSub.id ? updatedSub : s)));
          }
        }
        // Create new subs
        for (const desc of nonEmptySubs) {
          const sub = await createPlanSub({ description: desc.trim(), general_accounting_plan_id: updated.id, status: true, editable: true });
          if (sub) setSubs((prev) => [...prev, sub]);
        }
        setPlanDialogOpen(false);
      } else {
        setPlanError('Failed to update. Please try again.');
      }
    } else {
      const created = await createPlan(payload);
      if (created) {
        setPlans((prev) => [...prev, created]);
        for (const desc of nonEmptySubs) {
          const sub = await createPlanSub({ description: desc.trim(), general_accounting_plan_id: created.id, status: true, editable: true });
          if (sub) setSubs((prev) => [...prev, sub]);
        }
        setPlanDialogOpen(false);
      } else {
        setPlanError('Failed to create. Please try again.');
      }
    }
    setPlanLoading(false);
  };

  const requestDeletePlan = (plan: GeneralAccountingPlan) => {
    setDeleteTarget(plan);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!deleteTarget) return;
    const ok = await deletePlan(deleteTarget.id);
    if (ok) setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteConfirmOpen(false);
  };

  // ── Sub handlers ──────────────────────────────────────────────────────────
  const handleSaveSub = async (payload: { planId: string; editId: string | null; description: string }): Promise<boolean> => {
    setSubSaving(true);
    const data = { description: payload.description, general_accounting_plan_id: payload.planId, status: true, editable: true };
    if (payload.editId) {
      const updated = await updatePlanSub(payload.editId, data);
      setSubSaving(false);
      if (updated) { setSubs((prev) => prev.map((s) => (s.id === updated.id ? updated : s))); return true; }
      return false;
    } else {
      const created = await createPlanSub(data);
      setSubSaving(false);
      if (created) { setSubs((prev) => [...prev, created]); return true; }
      return false;
    }
  };

  const requestDeleteSub = (sub: GeneralAccountingPlanSub) => {
    setDeleteSubTarget(sub);
    setDeleteSubConfirmOpen(true);
  };

  const confirmDeleteSub = async () => {
    if (!deleteSubTarget) return;
    const ok = await deletePlanSub(deleteSubTarget.id);
    if (ok) setSubs((prev) => prev.filter((s) => s.id !== deleteSubTarget.id));
    setDeleteSubTarget(null);
    setDeleteSubConfirmOpen(false);
  };

  // ── Request handler ───────────────────────────────────────────────────────
  const handleRequest = async (payload: {
    accountyType: AccountType;
    planId: string;
    hasSub: boolean;
    subId: string | null;
    request: string;
  }): Promise<boolean> => {
    setRequestLoading(true);
    const result = await createPlanRequest({
      accounty_type: payload.accountyType,
      general_accounting_plan_id: payload.planId,
      has_sub: payload.hasSub,
      general_accounting_plan_sub_id: payload.subId,
      request: payload.request,
      status: 'pending',
    });
    setRequestLoading(false);
    return result !== null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="General Accounting Plan"
        subtitle="Manage budgetary and financial transaction account classifications"
        icon={<BookOpen className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard
          label="Plan Records"
          value={totalPlans}
          icon={<ListChecks className="w-4 h-4" />}
        />
        <StatCard
          label="With Sub-Records"
          value={plansWithSubRecords}
          color="success"
          icon={<Layers3 className="w-4 h-4" />}
        />
        <StatCard
          label="Active Plans"
          value={activePlans}
          color="primary"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
        <StatCard
          label="Total Sub-Records"
          value={totalSubRecords}
          color="warning"
          icon={<Layers3 className="w-4 h-4" />}
        />
      </StatsRow>

      {/* Tab bar */}
      <div className="rounded-2xl border border-border bg-surface p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors rounded-xl ${
              activeTab === 'plans'
                ? 'bg-success text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-background'
            }`}
          >
            Accounting Plans
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors rounded-xl ${
              activeTab === 'request'
                ? 'bg-success text-white shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-background'
            }`}
          >
            Send Request
          </button>
        </div>
      </div>

      {activeTab === 'plans' && (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Accounting Plan Records</h2>
              <p className="text-xs text-muted">All plans, status, and linked sub-records in one view.</p>
            </div>
            <span className="text-xs text-muted px-2.5 py-1 rounded-full bg-background border border-border">
              {totalPlans} {totalPlans === 1 ? 'record' : 'records'}
            </span>
          </div>

          <ActionsBar>
            <PrimaryButton onClick={openAddPlan}>
              <Plus className="w-4 h-4" />
              Add Plan
            </PrimaryButton>
          </ActionsBar>

          <AccountingPlanList
            plans={plans}
            subs={subs}
            search={planSearch}
            onSearchChange={setPlanSearch}
            onEdit={openEditPlan}
            onDelete={requestDeletePlan}
            onSaveSub={handleSaveSub}
            onDeleteSub={requestDeleteSub}
            subSaving={subSaving}
          />
        </div>
      )}

      {activeTab === 'request' && (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Submit Plan Request</h2>
              <p className="text-xs text-muted">Send updates for plans and sub-records to be reviewed.</p>
            </div>
            <span className="text-xs text-muted px-2.5 py-1 rounded-full bg-background border border-border">
              {totalSubRecords} total sub-records
            </span>
          </div>

          <AccountingPlanRequestTab
            plans={plans}
            subs={subs}
            onSubmit={handleRequest}
            isLoading={requestLoading}
          />
        </div>
      )}

      {/* Plan dialog */}
      <AccountingPlanDialog
        open={planDialogOpen}
        onClose={() => setPlanDialogOpen(false)}
        onSubmit={handlePlanSubmit}
        accountyType={planAccountyType}
        onAccountyTypeChange={setPlanAccountyType}
        description={planDescription}
        onDescriptionChange={setPlanDescription}
        hasSub={planHasSub}
        onHasSubChange={(val) => { setPlanHasSub(val); if (!val) setPlanSubDescriptions(['']); }}
        subDescriptions={planSubDescriptions}
        onSubDescriptionsChange={setPlanSubDescriptions}
        existingSubs={editingPlanSubs}
        onExistingSubsChange={setEditingPlanSubs}
        isLoading={planLoading}
        editMode={!!editingPlan}
        error={planError}
      />

      {/* Plan delete confirm */}
      {deleteConfirmOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative bg-surface border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Delete Plan Record</h3>
            {deleteTarget.has_sub ? (
              <p className="text-sm text-warning">
                <strong>Warning:</strong> This plan has sub-records linked to it. Deleting it may
                orphan those records. Are you sure you want to proceed?
              </p>
            ) : (
              <p className="text-sm text-muted">
                Are you sure you want to delete <strong>"{deleteTarget.description}"</strong>? This
                action cannot be undone.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-background transition-colors"
                onClick={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90 transition-colors"
                onClick={confirmDeletePlan}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub delete confirm */}
      {deleteSubConfirmOpen && deleteSubTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteSubConfirmOpen(false)} />
          <div className="relative bg-surface border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Delete Sub-record</h3>
            <p className="text-sm text-muted">
              Are you sure you want to delete <strong>"{deleteSubTarget.description}"</strong>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-background transition-colors"
                onClick={() => { setDeleteSubConfirmOpen(false); setDeleteSubTarget(null); }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90 transition-colors"
                onClick={confirmDeleteSub}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralAccountingPlan;
