import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ActionsBar, IconButton, PrimaryButton } from '@/components/ui';
import { BaseDialog, FormInput } from '@/components/ui/dialog';
import { supabase } from '@/services/supabase';
import type { TreasuryAccountCode } from '@/types/treasury.types';

interface AccountCodeManagementProps {
  accountCodes: TreasuryAccountCode[];
  isLoading: boolean;
  onCodeUpsert: (code: TreasuryAccountCode) => void;
  onCodeDelete: (id: string) => void;
}

export default function AccountCodeManagement({
  accountCodes,
  isLoading,
  onCodeUpsert,
  onCodeDelete,
}: AccountCodeManagementProps) {
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<TreasuryAccountCode | null>(null);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');

  const openAdd = () => {
    setEditing(null);
    setCode('');
    setTitle('');
    setCategory('');
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (item: TreasuryAccountCode) => {
    setEditing(item);
    setCode(item.code);
    setTitle(item.description);
    setCategory(item.category);
    setError('');
    setDialogOpen(true);
  };

  const filtered = useMemo(() => {
    return accountCodes.filter((item) => {
      const term = search.toLowerCase();
      return (
        !search.trim() ||
        item.code.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    });
  }, [accountCodes, search]);

  const handleSubmit = async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    if (!code.trim()) {
      setError('Code is required.');
      return;
    }

    if (!title.trim()) {
      setError('Account Title is required.');
      return;
    }

    setSaving(true);
    setError('');

    const basePayload = {
      code: code.trim(),
      description: title.trim(),
      category: category.trim(),
    };

    const payload = editing ? { id: editing.id, ...basePayload } : basePayload;

    const { data, error: upsertError } = await supabase
      .schema('treasury')
      .from('account_codes')
      .upsert(payload)
      .select('*')
      .single();

    setSaving(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    onCodeUpsert(data as TreasuryAccountCode);
    setDialogOpen(false);
  };

  const handleDelete = async (item: TreasuryAccountCode) => {
    if (!supabase) {
      alert('Supabase is not configured.');
      return;
    }

    const confirmed = confirm(`Delete account code ${item.code}?`);
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .schema('treasury')
      .from('account_codes')
      .delete()
      .eq('id', item.id);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    onCodeDelete(item.id);
  };

  const thCls = 'bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border text-xs uppercase tracking-wide';
  const tdCls = 'px-4 py-3 border-b border-border/50 text-sm';

  return (
    <>
      <ActionsBar>
        <PrimaryButton onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Add Account Code
        </PrimaryButton>
      </ActionsBar>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="Search code or account title..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thCls}>#</th>
                <th className={thCls}>Code</th>
                <th className={thCls}>Account Title</th>
                <th className={thCls}>Category</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-8 border-b border-border/50">
                    Loading account codes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-8 border-b border-border/50">
                    No account codes found.
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} className="hover:bg-background transition-colors">
                    <td className={tdCls}>{index + 1}</td>
                    <td className={tdCls}>{item.code}</td>
                    <td className={tdCls}>{item.description}</td>
                    <td className={tdCls}>{item.category}</td>
                    <td className={`${tdCls} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <IconButton title="Edit" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton title="Delete" variant="danger" onClick={() => handleDelete(item)}>
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={editing ? 'Edit Account Code' : 'Add Account Code'}
        submitLabel={editing ? 'Save Changes' : 'Add Code'}
        isLoading={saving}
      >
        <div className="space-y-4">
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <FormInput
            id="treasury-account-code"
            label="Code"
            value={code}
            onChange={setCode}
            placeholder="e.g., 4-01-01-010"
            required
          />

          <FormInput
            id="treasury-account-title"
            label="Account Title"
            value={title}
            onChange={setTitle}
            placeholder="e.g., Real Property Tax"
            required
          />

          <FormInput
            id="treasury-account-category"
            label="Category"
            value={category}
            onChange={setCategory}
            placeholder="e.g., Tax Revenue"
          />
        </div>
      </BaseDialog>
    </>
  );
}
