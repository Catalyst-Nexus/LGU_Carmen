import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType = 'completed' | 'in-progress' | 'pending' | 'overdue' | 'processed' | 'rejected' | 'on-hold' | 'reconciled' | 'unmatched';

interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
}

const StatusBadge = ({ status, showIcon = true }: StatusBadgeProps) => {
  const statusConfig: Record<StatusType, { bg: string; icon: typeof CheckCircle }> = {
    completed: {
      bg: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      icon: CheckCircle,
    },
    'in-progress': {
      bg: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      icon: Clock,
    },
    pending: {
      bg: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
      icon: Clock,
    },
    overdue: {
      bg: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      icon: AlertCircle,
    },
    processed: {
      bg: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      icon: CheckCircle,
    },
    rejected: {
      bg: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      icon: AlertCircle,
    },
    'on-hold': {
      bg: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
      icon: Clock,
    },
    reconciled: {
      bg: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
      icon: CheckCircle,
    },
    unmatched: {
      bg: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.bg)}>
      {showIcon && <Icon className="w-4 h-4" />}
      {status.replace('-', ' ')}
    </span>
  );
};

export default StatusBadge;
