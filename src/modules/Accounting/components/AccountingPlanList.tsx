import { Fragment, useState } from 'react';
import { Pencil, Trash2, Plus, Search, Check, X } from 'lucide-react';
import { StatusBadge, IconButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { GeneralAccountingPlan, GeneralAccountingPlanSub } from '@/types/accounting.types';

interface InlineSubForm {
  planId: string;
  editId: string | null;
  description: string;
}

interface AccountingPlanListProps {
  plans: GeneralAccountingPlan[];
  subs: GeneralAccountingPlanSub[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (plan: GeneralAccountingPlan) => void;
  onDelete: (plan: GeneralAccountingPlan) => void;
  onSaveSub: (payload: { planId: string; editId: string | null; description: string }) => Promise<boolean>;
  onDeleteSub: (sub: GeneralAccountingPlanSub) => void;
  subSaving?: boolean;
}

const AccountingPlanList = ({
  plans,
  subs,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onSaveSub,
  onDeleteSub,
  subSaving = false,
}: AccountingPlanListProps) => {
  const [inlineForm, setInlineForm] = useState<InlineSubForm | null>(null);

  const filtered = search.trim()
    ? plans.filter((p) => p.description.toLowerCase().includes(search.toLowerCase()))
    : plans;

  const openAddSub = (planId: string) => {
    setInlineForm({ planId, editId: null, description: '' });
  };

  const openEditSub = (sub: GeneralAccountingPlanSub) => {
    if (!sub.editable) return;
    setInlineForm({ planId: sub.general_accounting_plan_id, editId: sub.id, description: sub.description });
  };

  const cancelInline = () => setInlineForm(null);

  const submitInline = async () => {
    if (!inlineForm || !inlineForm.description.trim()) return;
    const ok = await onSaveSub(inlineForm);
    if (ok) setInlineForm(null);
  };

  const thCls = 'bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border text-xs uppercase tracking-wide';
  const tdCls = 'px-4 py-3 border-b border-border/50 text-sm';

  return (
    <div className="bg-background border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {plans.length} records
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={cn(thCls, 'w-12')}>#</th>
              <th className={thCls}>Account Type</th>
              <th className={thCls}>Description</th>
              <th className={cn(thCls, 'w-36')}>Sub-records</th>
              <th className={cn(thCls, 'w-24')}>Status</th>
              <th className={cn(thCls, 'w-24 text-right')}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-8 border-b border-border/50">
                  No accounting plan records found.
                </td>
              </tr>
            ) : (
              filtered.map((plan, idx) => {
                const planSubs = subs.filter((s) => s.general_accounting_plan_id === plan.id);
                const isInlineActive = inlineForm?.planId === plan.id;

                return (
                  <Fragment key={plan.id}>
                    <tr className="hover:bg-background transition-colors">
                      <td className={cn(tdCls, 'text-muted')}>{idx + 1}</td>
                      <td className={tdCls}>{plan.accounty_type}</td>
                      <td className={tdCls}>{plan.description}</td>
                      <td className={tdCls}>
                        {plan.has_sub ? (
                          <span className="text-xs font-medium text-success">
                            {planSubs.length} sub{planSubs.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <StatusBadge status={plan.status ? 'active' : 'inactive'} />
                      </td>
                      <td className={cn(tdCls, 'text-right')}>
                        <div className="flex items-center justify-end gap-1">
                          <IconButton onClick={() => plan.editable && onEdit(plan)} title={plan.editable ? 'Edit' : 'Not editable'}>
                            <Pencil className={`w-4 h-4 ${!plan.editable ? 'opacity-30' : ''}`} />
                          </IconButton>
                          <IconButton onClick={() => onDelete(plan)} variant="danger" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>

                    {plan.has_sub && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-background border-b border-border/50">
                          <div className="ml-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                                Sub-records › {plan.description}
                              </span>
                              {!isInlineActive && (
                                <button
                                  onClick={() => openAddSub(plan.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-success text-white rounded-lg text-xs font-medium hover:bg-success/90 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Add Sub
                                </button>
                              )}
                            </div>

                            <div className="border border-border/60 rounded-xl overflow-hidden bg-surface">
                              <div className="grid grid-cols-[40px_minmax(220px,1fr)_110px_96px] items-center px-3 py-2 border-b border-border/60 text-xs text-muted">
                                <span>#</span>
                                <span>Description</span>
                                <span>Status</span>
                                <span className="text-right">Actions</span>
                              </div>

                              {planSubs.map((sub, si) => (
                                <div
                                  key={sub.id}
                                  className={cn(
                                    'grid grid-cols-[40px_minmax(220px,1fr)_110px_96px] items-center px-3 py-2 border-b border-border/30 text-sm',
                                    inlineForm?.editId === sub.id && 'hidden'
                                  )}
                                >
                                  <span className="text-xs text-muted">{si + 1}</span>
                                  <span>{sub.description}</span>
                                  <span>
                                    <StatusBadge status={sub.status ? 'active' : 'inactive'} />
                                  </span>
                                  <div className="flex items-center justify-end gap-1">
                                    <IconButton onClick={() => openEditSub(sub)} title={sub.editable ? 'Edit' : 'Not editable'}>
                                      <Pencil className={`w-3.5 h-3.5 ${!sub.editable ? 'opacity-30' : ''}`} />
                                    </IconButton>
                                    <IconButton onClick={() => onDeleteSub(sub)} variant="danger" title="Delete">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </IconButton>
                                  </div>
                                </div>
                              ))}

                              {isInlineActive && (
                                <div className="grid grid-cols-[40px_minmax(220px,1fr)_110px_96px] items-center px-3 py-2 border-b border-border/30 bg-success/5">
                                  <span className="text-xs text-muted">
                                    {inlineForm.editId ? planSubs.findIndex((s) => s.id === inlineForm.editId) + 1 : planSubs.length + 1}
                                  </span>
                                  <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-2 py-1.5 border border-success/50 rounded-md text-sm bg-background text-foreground focus:outline-none focus:border-success"
                                    placeholder="e.g., Cash, Check, Authority to Debit Account"
                                    value={inlineForm.description}
                                    onChange={(e) => setInlineForm((f) => f ? { ...f, description: e.target.value } : f)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') submitInline(); if (e.key === 'Escape') cancelInline(); }}
                                  />
                                  <span className="text-xs text-muted">Draft</span>
                                  <div className="flex items-center justify-end gap-1">
                                    <IconButton onClick={() => !subSaving && submitInline()} title="Save">
                                      <Check className="w-3.5 h-3.5 text-success" />
                                    </IconButton>
                                    <IconButton onClick={cancelInline} variant="danger" title="Cancel">
                                      <X className="w-3.5 h-3.5" />
                                    </IconButton>
                                  </div>
                                </div>
                              )}

                              {planSubs.length === 0 && !isInlineActive && (
                                <div className="text-center text-muted text-xs py-3">
                                  No sub-records yet. Click "Add Sub" to create one.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-3 text-xs text-muted">
          {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
        </div>
      )}
    </div>
  );
};

export default AccountingPlanList;

