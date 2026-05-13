import { forwardRef, type SelectHTMLAttributes } from 'react';

import { inputCls } from './Field';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ placeholder, options, className, ...props }, ref) => {
    return (
      <select ref={ref} className={`${inputCls} ${className ?? ''}`} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);

Select.displayName = 'Select';
