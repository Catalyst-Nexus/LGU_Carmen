import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { supabase } from '@/services/supabase';
import type { TreasuryAccountCode, TreasuryOfficialReceipt } from '@/types/treasury.types';
import AccountCodeManagement from '../components/AccountCodeManagement';
import OfficialReceiptGeneration from '../components/OfficialReceiptGeneration';

type Tab = 'plan' | 'operation';

export default function OfficialReceiptPage() {
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [accountCodes, setAccountCodes] = useState<TreasuryAccountCode[]>([]);
  const [receipts, setReceipts] = useState<TreasuryOfficialReceipt[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  useEffect(() => {
    const loadAccountCodes = async () => {
      if (!supabase) return;

      setLoadingCodes(true);
      const { data, error } = await supabase
        .schema('treasury')
        .from('account_codes')
        .select('*')
        .order('code', { ascending: true });

      setLoadingCodes(false);

      if (error) {
        console.error('Failed to load account codes:', error);
        return;
      }

      setAccountCodes((data || []) as TreasuryAccountCode[]);
    };

    const loadReceipts = async () => {
      if (!supabase) return;

      setLoadingReceipts(true);
      const { data, error } = await supabase
        .schema('treasury')
        .from('official_receipts')
        .select(`
          *,
          account:account_code_id(*)
        `)
        .order('created_at', { ascending: false });

      setLoadingReceipts(false);

      if (error) {
        console.error('Failed to load official receipts:', error);
        return;
      }

      setReceipts((data || []) as TreasuryOfficialReceipt[]);
    };

    loadAccountCodes();
    loadReceipts();
  }, []);

  const handleCodeUpsert = (saved: TreasuryAccountCode) => {
    setAccountCodes((prev) => {
      const exists = prev.some((item) => item.id === saved.id);
      const next = exists
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [...prev, saved];
      return next.sort((a, b) => a.code.localeCompare(b.code));
    });
  };

  const handleCodeDelete = (id: string) => {
    setAccountCodes((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReceiptCreated = (receipt: TreasuryOfficialReceipt) => {
    setReceipts((prev) => [receipt, ...prev]);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Official Receipt Management"
        subtitle="Manage Treasury Account Plan and OR generation"
        icon={<FileText className="w-6 h-6" />}
      />

      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'plan'
              ? 'border-success text-success'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Treasury Account Plan
        </button>
        <button
          onClick={() => setActiveTab('operation')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'operation'
              ? 'border-success text-success'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          OR Generation
        </button>
      </div>

      {activeTab === 'plan' && (
        <AccountCodeManagement
          accountCodes={accountCodes}
          isLoading={loadingCodes}
          onCodeUpsert={handleCodeUpsert}
          onCodeDelete={handleCodeDelete}
        />
      )}

      {activeTab === 'operation' && (
        <OfficialReceiptGeneration
          accountCodes={accountCodes}
          receipts={receipts}
          isLoadingReceipts={loadingReceipts}
          onReceiptCreated={handleReceiptCreated}
        />
      )}
    </div>
  );
}
