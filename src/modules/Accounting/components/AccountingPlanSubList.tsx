import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, StatusBadge, IconButton } from '@/components/ui';
import type { GeneralAccountingPlan, GeneralAccountingPlanSub } from '@/types/accounting.types';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  budgetary: 'Budgetary Accounts',
  financial: 'Financial Transactions',
};

interface AccountingPlanSubListProps {
  subs: GeneralAccountingPlanSub[];
  plans: GeneralAccountingPlan[];
  search: string;
  onSearchChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (id: string) => void;
  onEdit: (sub: GeneralAccountingPlanSub) => void;
  onDelete: (sub: GeneralAccountingPlanSub) => void;
}

const AccountingPlanSubList = ({
  subs,
  plans,
  search,
  onSearchChange,
  planFilter,
  onPlanFilterChange,
  onEdit,
  onDelete,
}: AccountingPlanSubListProps) => {
  const filtered = subs.filter((s) => {
    const matchSearch = search.trim()
      ? s.description.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchPlan = planFilter ? s.general_accounting_plan_id === planFilter : true;
    return matchSearch && matchPlan;
  });

  return (
    <div className="space-y-3">
      {/* Parent-plan filter toolbar */}
      <div className="flex items-center gap-3">
        <select
          className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success min-w-[220px]"
          value={planFilter}
          onChange={(e) => onPlanFilterChange(e.target.value)}
        >
          <option value="">All Plan Types</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.description} ({ACCOUNT_TYPE_LABELS[p.accounty_type] ?? p.accounty_type})
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={filtered}
        searchValue={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search by description..."
        emptyMessage="No sub-records found."
        columns={[
          {
            key: 'description',
            header: 'Description',
          },
          {
            key: 'general_accounting_plan_id',
            header: 'Parent Plan',
            render: (item) => (
              <span className="text-sm">
                {item.plan?.description ?? item.general_accounting_plan_id}
              </span>
            ),
          },
          {
            key: 'editable',
            header: 'Editable',
            render: (item) => (
              <StatusBadge status={item.editable ? 'active' : 'inactive'} />
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => (
              <StatusBadge status={item.status ? 'active' : 'inactive'} />
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'w-24 text-right',
            render: (item) => (
              <div className="flex items-center justify-end gap-1">
                <IconButton
                  onClick={() => item.editable && onEdit(item)}
                  title={item.editable ? 'Edit' : 'Not editable'}
                >
                  <Pencil className={`w-4 h-4 ${!item.editable ? 'opacity-30' : ''}`} />
                </IconButton>
                <IconButton
                  onClick={() => onDelete(item)}
                  variant="danger"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AccountingPlanSubList;
