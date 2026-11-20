'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'none' | 'pink' | 'teal' | 'orange';
}

export function GlassCard({ children, className = '', glow = 'none' }: GlassCardProps) {
  const glowStyles = {
    none: '',
    pink: 'shadow-[0_0_25px_rgba(255,46,147,0.35)] border-vc-pink/40',
    teal: 'shadow-[0_0_25px_rgba(0,229,212,0.35)] border-vc-teal/40',
    orange: 'shadow-[0_0_25px_rgba(255,122,61,0.35)] border-vc-orange/40',
  };

  return (
    <div
      className={`relative rounded-2xl bg-vc-dark/75 backdrop-blur-md border border-white/15 p-5 text-white transition-all duration-300 ${glowStyles[glow]} ${className}`}
    >
      {children}
    </div>
  );
}
