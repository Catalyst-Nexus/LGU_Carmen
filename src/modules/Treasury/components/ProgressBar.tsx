import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  percentage?: number;
  showLabel?: boolean;
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar = ({
  value,
  max = 100,
  percentage,
  showLabel = true,
  showValue = true,
  color = 'primary',
  size = 'md',
}: ProgressBarProps) => {
  const percent = percentage !== undefined ? percentage : (value / max) * 100;

  const colorClasses = {
    primary: 'bg-gradient-to-r from-primary to-blue-500',
    success: 'bg-gradient-to-r from-success to-green-400',
    warning: 'bg-gradient-to-r from-warning to-yellow-400',
    danger: 'bg-gradient-to-r from-danger to-red-400',
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1">
        {showLabel && <div className="text-xs font-medium text-foreground mb-1">{percent}%</div>}
        <div className={cn('bg-border rounded-full overflow-hidden', sizeClasses[size])}>
          <div
            className={cn('h-full transition-all duration-300', colorClasses[color])}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
      {showValue && (
        <span className="text-xs font-medium text-foreground whitespace-nowrap w-10 text-right">
          {percent}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
