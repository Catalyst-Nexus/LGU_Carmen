import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  name: string;
  institution: string;
  accountNumber: string;
  bookBalance: number;
  bankBalance: number;
  difference: number;
  reconciliationStatus: 'complete' | 'in-progress' | 'pending';
  isSelected?: boolean;
  onClick?: () => void;
}

const AccountCard = ({
  name,
  institution,
  accountNumber,
  bookBalance,
  bankBalance,
  difference,
  reconciliationStatus,
  isSelected = false,
  onClick,
}: AccountCardProps) => {
  const statusConfig = {
    complete: {
      bg: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
      icon: CheckCircle,
    },
    'in-progress': {
      bg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
      icon: AlertCircle,
    },
    pending: {
      bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
      icon: AlertCircle,
    },
  };

  const StatusIcon = statusConfig[reconciliationStatus].icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-2xl border-2 cursor-pointer transition-all',
        isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-surface hover:border-primary/50'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground text-sm">{name}</p>
          <p className="text-muted text-xs mt-1">{institution}</p>
          <p className="text-muted text-xs mt-0.5">Account: {accountNumber}</p>
        </div>
        <div className={cn('p-2 rounded-lg', statusConfig[reconciliationStatus].bg)}>
          <StatusIcon className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Book Balance</span>
          <span className="font-medium text-foreground">₱{bookBalance.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">Bank Balance</span>
          <span className="font-medium text-foreground">₱{bankBalance.toLocaleString()}</span>
        </div>
        <div className="pt-2 border-t border-border/50 flex justify-between text-xs">
          <span className="text-muted">Difference</span>
          <span className={cn('font-medium', difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
            ₱{difference.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
