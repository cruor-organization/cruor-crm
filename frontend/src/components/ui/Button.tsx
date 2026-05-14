import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'subtle';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantMap: Record<ButtonVariant, string> = {
  primary: 'bg-cruor-600 text-white hover:bg-cruor-700 border-transparent',
  dark: 'bg-ink-900 text-neutral-50 hover:bg-ink-800 border-transparent',
  secondary:
    'bg-surface text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300',
  ghost:
    'bg-transparent text-neutral-600 border-transparent hover:bg-neutral-100 hover:text-neutral-900',
  subtle: 'bg-neutral-100 text-neutral-700 border-transparent hover:bg-neutral-200',
};

const sizeMap: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  /**
   * Para uso polimórfico (e.g. renderizar como <Link>), envolve o Button
   * no componente pretendido e passa `asChild` ou usa Button como children.
   * Alternativa: usa `as` prop via cast explícito na call-site.
   */
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={`inline-flex items-center gap-2 rounded-control border font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cruor-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 ${variantMap[variant]} ${sizeMap[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
