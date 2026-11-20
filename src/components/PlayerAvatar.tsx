'use client';

import React from 'react';

interface PlayerAvatarProps {
  nickname: string;
  emoji: string;
  isHost?: boolean;
  score?: number;
  level?: number;
  isConnected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  subtitle?: string;
}

export function PlayerAvatar({
  nickname,
  emoji,
  isHost = false,
  score,
  level,
  isConnected = true,
  size = 'md',
  selected = false,
  onClick,
  className = '',
  subtitle,
}: PlayerAvatarProps) {
  const sizeMap = {
    sm: { container: 'p-1.5', emoji: 'text-xl w-8 h-8', text: 'text-xs', score: 'text-xs' },
    md: { container: 'p-2.5', emoji: 'text-2xl sm:text-3xl w-12 h-12', text: 'text-sm font-semibold', score: 'text-sm font-bold' },
    lg: { container: 'p-4', emoji: 'text-4xl sm:text-5xl w-16 h-16', text: 'text-base font-bold', score: 'text-base font-black' },
  };

  const currentSize = sizeMap[size];
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 select-none ${
        currentSize.container
      } ${
        selected
          ? 'bg-gradient-to-r from-vc-pink/30 to-vc-orange/30 border-2 border-vc-pink shadow-[0_0_20px_rgba(255,46,147,0.7)] scale-[1.02]'
          : 'bg-vc-dark/60 border border-white/10 hover:border-white/30'
      } ${isClickable ? 'cursor-pointer active:scale-95 hover:bg-vc-dark/90' : ''} ${
        !isConnected ? 'opacity-40 grayscale' : ''
      } ${className}`}
    >
      {/* Emoji bubble */}
      <div className="relative flex-shrink-0">
        <div
          className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 shadow-inner ${currentSize.emoji}`}
        >
          <span>{emoji || '🎮'}</span>
        </div>

        {/* Host Crown */}
        {isHost && (
          <span
            className="absolute -top-2 -right-1 text-sm sm:text-base animate-bounce"
            title="Hostiteľ lobby"
          >
            👑
          </span>
        )}

        {/* Connection status indicator */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-vc-dark ${
            isConnected ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-gray-500'
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`truncate text-white ${currentSize.text}`}>
            {nickname}
          </p>
          {level !== undefined && level > 0 && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-vc-teal/20 text-vc-teal border border-vc-teal/40">
              Lvl {level}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-vc-teal truncate font-medium">{subtitle}</p>
        )}
      </div>

      {/* Score */}
      {score !== undefined && (
        <div className="text-right flex-shrink-0">
          <span className={`text-vc-gold font-display drop-shadow-[0_0_8px_rgba(255,200,87,0.6)] ${currentSize.score}`}>
            {score} <span className="text-[10px] text-white/70">b</span>
          </span>
        </div>
      )}
    </div>
  );
}
