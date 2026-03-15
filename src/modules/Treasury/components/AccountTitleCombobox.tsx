import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { TreasuryAccountCode } from '@/types/treasury.types';

interface AccountTitleComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: TreasuryAccountCode[];
  placeholder?: string;
  disabled?: boolean;
}

export default function AccountTitleCombobox({
  value,
  onChange,
  options,
  placeholder = 'Search account title...',
  disabled = false,
}: AccountTitleComboboxProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => options.find((item) => item.id === value) || null,
    [options, value]
  );

  useEffect(() => {
    if (selected) {
      setQuery(`${selected.code} - ${selected.description}`);
      return;
    }
    setQuery('');
  }, [selected]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((item) => {
      return (
        item.code.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    });
  }, [options, query]);

  const handleSelect = (item: TreasuryAccountCode) => {
    onChange(item.id);
    setQuery(`${item.code} - ${item.description}`);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder={placeholder}
          value={query}
          onFocus={() => !disabled && setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            if (!event.target.value.trim()) onChange('');
          }}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
          onClick={() => !disabled && setIsOpen((open) => !open)}
          disabled={disabled}
          aria-label="Toggle account title options"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-surface border border-border rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted">No account code matches your search.</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors"
                onClick={() => handleSelect(item)}
              >
                <div className="font-medium text-foreground">{item.description}</div>
                <div className="text-xs text-muted">{item.code} • {item.fund_type}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
