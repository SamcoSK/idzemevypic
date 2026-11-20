'use client';

import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { EMOJI_LIST } from '@/lib/constants';
import { sanitizeNickname, isForbiddenNickname } from '@/lib/gameUtils';

interface NicknameModalProps {
  isOpen: boolean;
  initialNickname?: string;
  initialEmoji?: string;
  onSave: (nickname: string, emoji: string) => void;
  onClose?: () => void;
  title?: string;
}

export function NicknameModal({
  isOpen,
  initialNickname = '',
  initialEmoji = '🍺',
  onSave,
  onClose,
  title = 'Tvoj Párty Profil',
}: NicknameModalProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [selectedEmoji, setSelectedEmoji] = useState(initialEmoji);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitized = sanitizeNickname(nickname.trim());

    if (sanitized.length < 2) {
      setError('Prezývka musí mať aspoň 2 znaky');
      return;
    }
    if (sanitized.length > 20) {
      setError('Prezývka môže mať najviac 20 znakov');
      return;
    }
    if (isForbiddenNickname(sanitized)) {
      setError('Nevhodná prezývka, vyber si inú');
      return;
    }

    setError(null);
    onSave(sanitized, selectedEmoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <GlassCard glow="teal" className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-white uppercase tracking-wide">
            {title}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-xl p-1"
            >
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nickname input */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-vc-teal font-bold mb-1">
              Tvoja Prezývka
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Napr. Šaňo, Miška..."
              maxLength={20}
              className="w-full bg-black/40 border-2 border-white/20 focus:border-vc-teal rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-white/30 outline-none transition-colors shadow-inner"
              autoFocus
            />
            {error && (
              <p className="text-xs text-vc-pink font-semibold mt-1">{error}</p>
            )}
          </div>

          {/* Emoji Avatar Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-vc-gold font-bold mb-1.5">
              Vyber si Avatar ({selectedEmoji})
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-black/30 rounded-xl border border-white/10 scrollbar-thin">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2 rounded-lg flex items-center justify-center transition-transform active:scale-90 ${
                    selectedEmoji === emoji
                      ? 'bg-gradient-to-br from-vc-pink to-vc-orange scale-110 shadow-[0_0_12px_#FF2E93]'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <NeonButton variant="primary" fullWidth size="lg" type="submit">
              🚀 Uložiť a pokračovať
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
