import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { inputCls } from './Field';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={3}
        className={`${inputCls} resize-y ${className ?? ''}`}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
