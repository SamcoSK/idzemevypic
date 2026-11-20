'use client';

import React from 'react';

interface TimerProps {
  seconds: number;
  totalSeconds?: number;
  className?: string;
  label?: string;
}

export function Timer({ seconds, totalSeconds = 20, className = '', label = 'Čas na odpoveď' }: TimerProps) {
  const percentage = Math.max(0, Math.min(100, (seconds / totalSeconds) * 100));
  const isUrgent = seconds <= 5 && seconds > 0;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Circle / Number container */}
      <div className="relative flex items-center justify-center">
        {/* Glowing circular progress SVG */}
        <svg className="w-16 h-16 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke={isUrgent ? '#FF2E93' : '#00E5D4'}
            strokeWidth="8"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * percentage) / 100}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
            style={{
              filter: isUrgent
                ? 'drop-shadow(0 0 8px #FF2E93)'
                : 'drop-shadow(0 0 8px #00E5D4)',
            }}
          />
        </svg>

        {/* Seconds Number in center */}
        <div
          className={`absolute inset-0 flex items-center justify-center font-display text-2xl sm:text-3xl font-black ${
            isUrgent ? 'text-vc-pink animate-ping-once drop-shadow-[0_0_12px_#FF2E93]' : 'text-white drop-shadow-[0_0_8px_#00E5D4]'
          }`}
        >
          {seconds}
        </div>
      </div>

      {label && (
        <span className="text-[11px] uppercase tracking-wider text-white/70 mt-1 font-semibold">
          {label}
        </span>
      )}
    </div>
  );
}
