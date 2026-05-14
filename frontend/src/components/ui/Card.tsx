import type { HTMLAttributes, ReactNode } from 'react';

// ---- Card.Header --------------------------------------------------------

interface CardHeaderProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

function CardHeader({ title, icon, actions }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cruor-50 text-cruor-600">
            {icon}
          </span>
        )}
        <span className="text-[13px] font-semibold tracking-tight text-neutral-900">{title}</span>
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}

// ---- Card ---------------------------------------------------------------

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
} as const;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /** Header opcional: { title, icon?, actions? } */
  header?: CardHeaderProps;
}

function CardRoot({ padding = 'md', header, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-neutral-200 bg-white shadow-card transition-colors duration-200 hover:border-neutral-300 ${header ? '' : paddingMap[padding]} ${className}`}
      {...props}
    >
      {header && <CardHeader {...header} />}
      {header ? <div className={paddingMap[padding]}>{children}</div> : children}
    </div>
  );
}

// Namespace export para suporte a <Card.Header> e uso directo de <Card>
export const Card = Object.assign(CardRoot, { Header: CardHeader });
