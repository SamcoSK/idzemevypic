'use client';

import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  pulsing?: boolean;
  children: React.ReactNode;
}

export function NeonButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  pulsing = false,
  children,
  className = '',
  disabled,
  ...props
}: NeonButtonProps) {
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm font-semibold min-h-[40px]',
    md: 'py-3.5 px-6 text-base font-bold min-h-[50px]',
    lg: 'py-4 px-8 text-lg font-black min-h-[60px]',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-vc-pink to-vc-orange text-white shadow-[0_0_20px_rgba(255,46,147,0.6)] hover:shadow-[0_0_30px_rgba(255,46,147,0.9)] border border-white/20 active:scale-[0.98]',
    secondary:
      'bg-vc-dark/80 text-vc-teal border-2 border-vc-teal shadow-[0_0_15px_rgba(0,229,212,0.4)] hover:shadow-[0_0_25px_rgba(0,229,212,0.8)] hover:bg-vc-teal/15 active:scale-[0.98]',
    danger:
      'bg-gradient-to-r from-red-600 to-vc-magenta text-white shadow-[0_0_20px_rgba(194,24,91,0.6)] hover:shadow-[0_0_30px_rgba(194,24,91,0.9)] border border-white/20 active:scale-[0.98]',
    ghost:
      'bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-transparent active:scale-[0.98]',
  };

  const pulseClass = pulsing && !disabled ? 'animate-pulse-glow' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-40 cursor-not-allowed hover:shadow-none active:scale-100' : '';

  return (
    <button
      disabled={disabled}
      className={`rounded-xl uppercase tracking-wider transition-all duration-200 select-none flex items-center justify-center gap-2 cursor-pointer font-display ${sizeClasses[size]} ${variantClasses[variant]} ${pulseClass} ${widthClass} ${disabledClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
