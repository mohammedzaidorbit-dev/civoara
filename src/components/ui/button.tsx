'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'navy' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

    const variants = {
      primary:
        'bg-slate-900 text-white hover:bg-slate-800 border border-slate-950',
      accent:
        'bg-sky-700 text-white hover:bg-sky-800 border border-sky-800',
      navy:
        'bg-[#0B1524] text-white hover:bg-slate-800 border border-slate-900',
      secondary:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300',
      outline:
        'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
      danger:
        'bg-rose-700 text-white hover:bg-rose-800 border border-rose-800',
    };

    const sizes = {
      sm: 'text-xs min-h-[36px] px-3 py-1.5 gap-1.5',
      md: 'text-sm min-h-[42px] px-4 py-2 gap-2',
      lg: 'text-base min-h-[46px] px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
