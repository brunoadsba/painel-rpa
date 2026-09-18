import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function SearchInput({
  label = 'Buscar automações',
  className = '',
  ...props
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor="bot-search" className="sr-only">
        {label}
      </label>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2"
      >
        ⌕
      </span>
      <input
        id="bot-search"
        type="search"
        placeholder="Buscar por nome ou descrição…"
        autoComplete="off"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 font-body text-sm text-white placeholder:text-muted-2 outline-none transition-colors focus:border-teal"
        {...props}
      />
    </div>
  );
}
