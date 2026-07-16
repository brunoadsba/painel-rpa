import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="mb-3.5">
      <label
        htmlFor={inputId}
        className="block font-mono text-[10.5px] text-muted uppercase tracking-wide mb-1.5"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full bg-navy-950 border border-navy-600 rounded-lg px-3 py-2.5 text-white font-mono text-sm outline-none transition-colors duration-150 focus:border-teal ${className}`}
        {...props}
      />
    </div>
  );
}
