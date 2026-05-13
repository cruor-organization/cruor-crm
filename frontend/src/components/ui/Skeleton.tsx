import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  height?: string;
  width?: string;
}

export function Skeleton({
  height = 'h-4',
  width = 'w-full',
  className = '',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-200 ${height} ${width} ${className}`}
      {...props}
    />
  );
}
