'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl sm:text-5xl',
    lg: 'text-5xl sm:text-7xl',
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* SVG Icon / Sun & Palm emblem */}
      <div className="relative mb-1 flex items-center justify-center">
        <svg
          viewBox="0 0 100 55"
          className="w-24 sm:w-32 h-14 overflow-visible drop-shadow-[0_0_15px_rgba(255,46,147,0.8)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFC857" />
              <stop offset="40%" stopColor="#FF7A3D" />
              <stop offset="80%" stopColor="#FF2E93" />
              <stop offset="100%" stopColor="#C2185B" />
            </linearGradient>
            <linearGradient id="neonTeal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00E5D4" />
              <stop offset="100%" stopColor="#FF2E93" />
            </linearGradient>
          </defs>

          {/* Synthwave Sun */}
          <circle cx="50" cy="35" r="28" fill="url(#sunGrad)" />
          {/* Sun horizontal stripes (retro bars) */}
          <rect x="22" y="24" width="56" height="2" fill="#0B0620" />
          <rect x="23" y="30" width="54" height="2.5" fill="#0B0620" />
          <rect x="25" y="37" width="50" height="3" fill="#0B0620" />
          <rect x="28" y="45" width="44" height="4" fill="#0B0620" />

          {/* Stylized Cocktail Glass / Palm silhouette on side */}
          <path
            d="M 20 45 L 30 20 L 40 20 L 50 45 Z"
            fill="#0B0620"
            opacity="0.3"
          />
          {/* Palm leaves */}
          <path
            d="M 22 45 Q 26 25 35 18 Q 42 15 48 18 Q 36 24 30 35 Q 25 42 22 45 Z"
            fill="#0B0620"
          />
          <path
            d="M 78 45 Q 74 25 65 18 Q 58 15 52 18 Q 64 24 70 35 Q 75 42 78 45 Z"
            fill="#0B0620"
          />
        </svg>
      </div>

      {/* Main typography */}
      <h1
        className={`font-display tracking-wider uppercase font-black text-transparent bg-clip-text bg-gradient-to-r from-vc-gold via-vc-pink to-vc-teal drop-shadow-[0_2px_12px_rgba(255,46,147,0.9)] ${sizeClasses[size]}`}
        style={{
          fontFamily: "'Bungee', Impact, sans-serif",
          textShadow: '0 0 20px rgba(255,46,147,0.7), 0 0 40px rgba(0,229,212,0.4)',
        }}
      >
        IdzemeVypic
      </h1>

      <span className="text-xs uppercase tracking-widest text-vc-teal font-bold mt-0.5 opacity-90 drop-shadow-[0_0_8px_rgba(0,229,212,0.8)]">
        Slovenská Párty Hra
      </span>
    </div>
  );
}
