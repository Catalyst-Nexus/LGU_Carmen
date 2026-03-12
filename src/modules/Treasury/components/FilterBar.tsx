import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  label?: string;
  className?: string;
}

const FilterBar = ({
  filters,
  activeFilter,
  onFilterChange,
  label = 'Filter',
  className,
}: FilterBarProps) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      <div className="flex gap-2 flex-wrap">
        {filters.map(filter => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
              activeFilter === filter.value
                ? 'bg-primary text-white border-primary'
                : 'border-border bg-background text-foreground hover:bg-surface'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
