'use client';

import React from 'react';

export function SynthwaveSun({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_0_35px_rgba(255,46,147,0.7)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sunGradFull" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFC857" />
            <stop offset="30%" stopColor="#FF7A3D" />
            <stop offset="65%" stopColor="#FF2E93" />
            <stop offset="100%" stopColor="#C2185B" />
          </linearGradient>
          <mask id="sunMask">
            <circle cx="100" cy="100" r="85" fill="#FFFFFF" />
            {/* Cutout stripes */}
            <rect x="0" y="80" width="200" height="3" fill="#000000" />
            <rect x="0" y="94" width="200" height="4.5" fill="#000000" />
            <rect x="0" y="110" width="200" height="6" fill="#000000" />
            <rect x="0" y="128" width="200" height="8" fill="#000000" />
            <rect x="0" y="148" width="200" height="10" fill="#000000" />
            <rect x="0" y="170" width="200" height="13" fill="#000000" />
          </mask>
        </defs>

        <circle cx="100" cy="100" r="85" fill="url(#sunGradFull)" mask="url(#sunMask)" />
      </svg>
    </div>
  );
}
