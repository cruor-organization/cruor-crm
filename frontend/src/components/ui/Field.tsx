import type { ReactNode } from 'react';

import { FieldError } from '@/lib/forms/FieldError';

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, required, error, children, className }: FieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

// Classe CSS reutilizável para inputs
export const inputCls =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-neutral-50 disabled:text-neutral-500';
