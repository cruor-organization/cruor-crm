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
      <label className="text-[13px] font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-cruor-600">*</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

// Classe CSS reutilizável para inputs, selects e textareas
export const inputCls =
  'w-full rounded-control border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 focus:border-cruor-400 focus:outline-none focus:ring-2 focus:ring-cruor-500/30 disabled:bg-neutral-50 disabled:text-neutral-400';
