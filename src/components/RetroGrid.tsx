'use client';

import React from 'react';

export function RetroGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none overflow-hidden absolute inset-x-0 bottom-0 h-48 ${className}`}>
      {/* Horizon glow line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-vc-pink to-transparent opacity-80 shadow-[0_0_15px_#FF2E93]" />

      {/* Perspective grid lines */}
      <div
        className="w-full h-full opacity-35"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 229, 212, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 46, 147, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 25px',
          transform: 'perspective(200px) rotateX(60deg) translateY(-20px)',
          transformOrigin: 'top center',
        }}
      />
    </div>
  );
}
