'use client';

import React from 'react';

export function PalmTree({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div
      className={`pointer-events-none select-none ${flip ? 'scale-x-[-1]' : ''} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 180"
        className="w-full h-full opacity-60 drop-shadow-[0_0_10px_rgba(43,10,74,0.9)]"
        fill="#0B0620"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Palm trunk */}
        <path
          d="M 20 180 Q 30 110 55 60 Q 58 55 60 52 L 65 54 Q 40 105 28 180 Z"
          fill="#0B0620"
        />
        {/* Leaves */}
        {/* Leaf 1 left down */}
        <path d="M 60 52 Q 35 45 10 65 Q 25 45 58 50 Z" />
        {/* Leaf 2 left up */}
        <path d="M 60 52 Q 25 25 5 35 Q 25 20 59 49 Z" />
        {/* Leaf 3 center top */}
        <path d="M 60 52 Q 55 10 40 0 Q 55 8 61 48 Z" />
        {/* Leaf 4 right top */}
        <path d="M 60 52 Q 80 15 105 10 Q 85 20 62 50 Z" />
        {/* Leaf 5 right mid */}
        <path d="M 60 52 Q 95 35 118 45 Q 92 42 62 52 Z" />
        {/* Leaf 6 right down */}
        <path d="M 60 52 Q 95 65 110 90 Q 88 68 61 54 Z" />
      </svg>
    </div>
  );
}
