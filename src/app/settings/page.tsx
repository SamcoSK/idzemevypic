'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { NeonButton } from '@/components/NeonButton';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { NicknameModal } from '@/components/NicknameModal';
import type { ContentMode } from '@/types';

export default function SettingsPage() {
  const { profile, updateProfile, playSoundEffect, triggerVibration } = usePlayerProfile();
  const [showNickModal, setShowNickModal] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const toggleSound = () => {
    const next = !profile.sound;
    updateProfile({ sound: next });
    if (next) playSoundEffect('click');
  };

  const toggleVibration = () => {
    const next = !profile.vibration;
    updateProfile({ vibration: next });
    if (next) triggerVibration(50);
  };

  const setContentMode = (mode: ContentMode) => {
    playSoundEffect('click');
    updateProfile({ contentMode: mode });
  };

  const handleApplySyncCode = () => {
    const code = syncCodeInput.trim().toUpperCase();
    if (code.length === 8) {
      updateProfile({ syncCode: code });
      setSavedNotice(true);
      playSoundEffect('win');
      setTimeout(() => setSavedNotice(false), 2000);
    } else {
      alert('Sync kód musí mať presne 8 znakov');
      playSoundEffect('wrong');
    }
  };

  const handleResetProfile = () => {
    if (confirm('Naozaj chceš vymazať svoj lokálny profil a začať nanovo?')) {
      localStorage.removeItem('idzemevypic_profile');
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 max-w-md mx-auto space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/"
          className="text-vc-teal text-xl active:scale-90 transition-transform font-bold"
        >
          ←
        </Link>
        <h1 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-vc-pink to-vc-teal uppercase">
          ⚙️ Nastavenia
        </h1>
      </div>

      {savedNotice && (
        <div className="p-3 bg-green-500/20 border border-green-500 text-green-300 rounded-xl text-xs font-bold text-center">
          ✓ Zmeny boli úspešne uložené!
        </div>
      )}

      {/* Profile Card */}
      <GlassCard glow="teal" className="p-4 space-y-3">
        <h3 className="text-xs uppercase font-bold tracking-wider text-vc-teal">
          Tvoj Profil
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-white/10 rounded-xl">
              {profile.emoji || '🎮'}
            </span>
            <div>
              <p className="text-base font-black text-white">
                {profile.nickname || 'Nepomenovaný hráč'}
              </p>
              <p className="text-xs text-white/50">
                18+ overené: {profile.ageVerified ? 'Áno 🔞' : 'Nie 😇'}
              </p>
            </div>
          </div>
          <NeonButton variant="secondary" size="sm" onClick={() => setShowNickModal(true)}>
            Zmeniť
          </NeonButton>
        </div>
      </GlassCard>

      {/* Audio & Haptic Feedback */}
      <GlassCard glow="pink" className="p-4 space-y-3">
        <h3 className="text-xs uppercase font-bold tracking-wider text-vc-pink">
          Efekty a Vnem
        </h3>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-bold text-white">Zvukové efekty</p>
            <p className="text-xs text-white/50">Tóny odpočítavania a víťazstva</p>
          </div>
          <button
            onClick={toggleSound}
            className={`w-14 h-8 rounded-full transition-colors p-1 flex items-center ${
              profile.sound ? 'bg-vc-pink justify-end shadow-[0_0_12px_#FF2E93]' : 'bg-white/20 justify-start'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white shadow-md" />
          </button>
        </div>

        <div className="flex items-center justify-between py-1 border-t border-white/10">
          <div>
            <p className="text-sm font-bold text-white">Vibrácie (mobil)</p>
            <p className="text-xs text-white/50">Haptická odozva pri hlase</p>
          </div>
          <button
            onClick={toggleVibration}
            className={`w-14 h-8 rounded-full transition-colors p-1 flex items-center ${
              profile.vibration ? 'bg-vc-teal justify-end shadow-[0_0_12px_#00E5D4]' : 'bg-white/20 justify-start'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </GlassCard>

      {/* Content Mode Selection */}
      <GlassCard glow="orange" className="p-4 space-y-3">
        <h3 className="text-xs uppercase font-bold tracking-wider text-vc-gold">
          Predvolený režim obsahu
        </h3>
        <p className="text-xs text-white/70">
          Určuje ostrosť otázok pri vytváraní tvojich lobby.
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {(['mierne', 'mix', 'odvazne'] as ContentMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setContentMode(mode)}
              className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                profile.contentMode === mode
                  ? 'bg-gradient-to-r from-vc-pink to-vc-orange border-white text-white shadow-[0_0_12px_#FF2E93]'
                  : 'bg-black/30 border-white/15 text-white/60 hover:text-white'
              }`}
            >
              {mode === 'mierne' && '😇 Mierne'}
              {mode === 'mix' && '🍹 Mix'}
              {mode === 'odvazne' && '🔞 18+'}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* 8-character Sync Code */}
      <GlassCard glow="teal" className="p-4 space-y-3">
        <h3 className="text-xs uppercase font-bold tracking-wider text-vc-teal">
          8-miestny Sync kód
        </h3>
        <p className="text-xs text-white/70">
          Umožňuje preniesť tvoj anonymný postup a body na iný telefón bez registrácie.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={syncCodeInput}
            onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
            placeholder={profile.syncCode || 'Napr. AB12CD34'}
            maxLength={8}
            className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white font-mono text-center uppercase tracking-widest outline-none focus:border-vc-teal"
          />
          <NeonButton variant="secondary" size="sm" onClick={handleApplySyncCode}>
            Spárovať
          </NeonButton>
        </div>
      </GlassCard>

      {/* Reset Profile */}
      <div className="pt-2 text-center">
        <button
          onClick={handleResetProfile}
          className="text-xs font-semibold text-red-400 hover:text-red-300 underline"
        >
          🗑️ Vymazať lokálne dáta a resetovať profil
        </button>
      </div>

      <NicknameModal
        isOpen={showNickModal}
        initialNickname={profile.nickname}
        initialEmoji={profile.emoji}
        onSave={(nick, emo) => {
          updateProfile({ nickname: nick, emoji: emo });
          setShowNickModal(false);
        }}
        onClose={() => setShowNickModal(false)}
      />
    </div>
  );
}
