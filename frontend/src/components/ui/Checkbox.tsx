import { forwardRef, type InputHTMLAttributes } from 'react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={`inline-flex cursor-pointer items-center gap-2 ${className ?? ''}`}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-300 text-cruor-600 focus:ring-cruor-500"
          {...props}
        />
        {label && <span className="text-sm text-neutral-700">{label}</span>}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
