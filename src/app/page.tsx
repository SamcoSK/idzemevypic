'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { SynthwaveSun } from '@/components/SynthwaveSun';
import { PalmTree } from '@/components/PalmTree';
import { RetroGrid } from '@/components/RetroGrid';
import { GlassCard } from '@/components/GlassCard';
import { NeonButton } from '@/components/NeonButton';
import { NicknameModal } from '@/components/NicknameModal';
import { AgeVerification } from '@/components/AgeVerification';
import { useSocket } from '@/hooks/useSocket';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import type { ContentMode } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { profile, loaded, updateProfile, playSoundEffect } = usePlayerProfile();

  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | null>(null);
  const [contentMode, setContentMode] = useState<ContentMode>('mix');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync contentMode from saved profile
  useEffect(() => {
    if (loaded && profile.contentMode) {
      setContentMode(profile.contentMode);
    }
  }, [loaded, profile.contentMode]);

  // Socket event listeners for lobby creation / join
  useEffect(() => {
    if (!socket) return;

    function onLobbyCreated(data: { lobby: { code: string }; player: any }) {
      setLoading(false);
      playSoundEffect('win');
      router.push(`/lobby/${data.lobby.code}`);
    }

    function onError(err: { message: string }) {
      setLoading(false);
      setError(err.message || 'Chyba servera');
      playSoundEffect('wrong');
    }

    socket.on('lobby_created', onLobbyCreated);
    socket.on('error', onError);

    return () => {
      socket.off('lobby_created', onLobbyCreated);
      socket.off('error', onError);
    };
  }, [socket, router, playSoundEffect]);

  // Execute create lobby
  const executeCreateLobby = (nick: string, emo: string, mode: ContentMode) => {
    if (!socket) return;
    setLoading(true);
    setError(null);
    playSoundEffect('click');
    socket.emit('create_lobby', {
      nickname: nick,
      emoji: emo,
      contentMode: mode,
    });
  };

  // Execute join lobby
  const executeJoinLobby = (joinCode: string, nick: string, emo: string) => {
    if (!socket) return;
    setLoading(true);
    setError(null);
    playSoundEffect('click');
    socket.emit('join_lobby', {
      code: joinCode.trim().toUpperCase(),
      nickname: nick,
      emoji: emo,
    });
  };

  const handleCreateLobbyClick = () => {
    playSoundEffect('click');
    if (!profile.nickname) {
      setPendingAction('create');
      setShowNicknameModal(true);
      return;
    }

    if (contentMode !== 'mierne' && !profile.ageVerified) {
      setPendingAction('create');
      setShowAgeModal(true);
      return;
    }

    executeCreateLobby(profile.nickname, profile.emoji, contentMode);
  };

  const handleJoinLobbyClick = () => {
    playSoundEffect('click');
    if (!showCodeInput) {
      setShowCodeInput(true);
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 5) {
      setError('Kód lobby musí mať presne 5 znakov');
      playSoundEffect('wrong');
      return;
    }

    if (!profile.nickname) {
      setPendingAction('join');
      setShowNicknameModal(true);
      return;
    }

    executeJoinLobby(cleanCode, profile.nickname, profile.emoji);
  };

  const handleSaveProfile = (newNickname: string, newEmoji: string) => {
    updateProfile({ nickname: newNickname, emoji: newEmoji });
    setShowNicknameModal(false);

    if (pendingAction === 'create') {
      if (contentMode !== 'mierne' && !profile.ageVerified) {
        setShowAgeModal(true);
      } else {
        executeCreateLobby(newNickname, newEmoji, contentMode);
      }
    } else if (pendingAction === 'join') {
      executeJoinLobby(code, newNickname, newEmoji);
    }
    setPendingAction(null);
  };

  const handleAgeConfirm = () => {
    updateProfile({ ageVerified: true });
    setShowAgeModal(false);

    if (pendingAction === 'create') {
      executeCreateLobby(profile.nickname, profile.emoji, contentMode);
    }
    setPendingAction(null);
  };

  return (
    <div className="relative min-h-dvh flex flex-col justify-between overflow-x-hidden p-4 sm:p-6">
      {/* Background synthwave decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <SynthwaveSun className="w-56 h-56 sm:w-72 sm:h-72 mx-auto -top-6 opacity-35" />
        <PalmTree className="w-36 h-48 absolute bottom-6 -left-6 opacity-40" />
        <PalmTree className="w-32 h-44 absolute bottom-12 -right-6 opacity-30" flip />
        <RetroGrid className="bottom-0" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto flex flex-col items-center space-y-6">
        {/* Logo */}
        <Logo size="lg" className="mt-4 sm:mt-8" />

        {/* Server connection pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-vc-dark/60 border border-white/10 text-xs select-none">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-green-400 shadow-[0_0_8px_#4ade80]'
                : 'bg-yellow-400 animate-pulse'
            }`}
          />
          <span className="text-white/80">
            {isConnected ? 'Server online' : 'Pripájanie k serveru...'}
          </span>
        </div>

        {/* Active Player Profile Badge */}
        <div
          onClick={() => setShowNicknameModal(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-vc-dark/70 border border-vc-teal/40 hover:border-vc-teal cursor-pointer transition-all duration-200 shadow-[0_0_15px_rgba(0,229,212,0.2)] hover:scale-105 active:scale-95"
          title="Klikni pre zmenu profilu"
        >
          <span className="text-2xl p-1 bg-white/10 rounded-xl">
            {profile.emoji || '🎮'}
          </span>
          <div className="text-left">
            <p className="text-xs text-vc-teal uppercase font-bold tracking-wider">
              Tvoj Profil
            </p>
            <p className="text-sm font-black text-white">
              {profile.nickname || 'Zadaj prezývku (klikni sem)'}
            </p>
          </div>
          <span className="text-xs text-white/50 ml-1">✏️</span>
        </div>

        {/* Action Glass Card */}
        <GlassCard glow="pink" className="w-full space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          {/* Primary Action: Create Lobby */}
          <div className="space-y-2">
            <NeonButton
              variant="primary"
              fullWidth
              size="lg"
              pulsing
              disabled={loading || !isConnected}
              onClick={handleCreateLobbyClick}
            >
              {loading && pendingAction === 'create' ? 'Vytváram lobby...' : '🎮 Vytvoriť lobby'}
            </NeonButton>

            {/* Content Mode Selection for Host */}
            <div className="pt-2">
              <label className="block text-[11px] uppercase tracking-wider text-vc-gold font-bold mb-1.5 text-center">
                Režim otázok pre lobby:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 text-xs select-none">
                {(['mierne', 'mix', 'odvazne'] as ContentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      playSoundEffect('click');
                      setContentMode(mode);
                      updateProfile({ contentMode: mode });
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold capitalize transition-all ${
                      contentMode === mode
                        ? 'bg-gradient-to-r from-vc-pink to-vc-orange text-white shadow-[0_0_10px_rgba(255,46,147,0.7)]'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {mode === 'mierne' && '😇 Mierne'}
                    {mode === 'mix' && '🍹 Mix'}
                    {mode === 'odvazne' && '🔞 18+'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-3 text-xs uppercase font-bold text-white/40 tracking-wider">
              alebo
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {/* Secondary Action: Join Lobby */}
          <div className="space-y-2">
            {showCodeInput ? (
              <div className="space-y-2 animate-slide-down">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  placeholder="ZADAJ 5-ZNAKOVÝ KÓD"
                  maxLength={5}
                  className="w-full text-center uppercase tracking-widest text-2xl font-display font-black bg-black/60 border-2 border-vc-teal rounded-xl py-3 text-vc-gold placeholder-white/20 outline-none shadow-[0_0_15px_rgba(0,229,212,0.3)] focus:shadow-[0_0_25px_rgba(0,229,212,0.7)]"
                  autoFocus
                />
                <NeonButton
                  variant="secondary"
                  fullWidth
                  size="md"
                  disabled={loading || code.trim().length !== 5}
                  onClick={handleJoinLobbyClick}
                >
                  {loading && pendingAction === 'join' ? 'Pripájam...' : '🔑 Vstúpiť do hry'}
                </NeonButton>
              </div>
            ) : (
              <NeonButton
                variant="secondary"
                fullWidth
                size="md"
                onClick={handleJoinLobbyClick}
              >
                🔑 Pripojiť sa kódom
              </NeonButton>
            )}
          </div>
        </GlassCard>

        {/* Quick info / TV mode shortcut */}
        <p className="text-xs text-white/50 text-center tracking-wide">
          Hra pre 2 až 12 priateľov na domácej Wi-Fi 🍹 Bez registrácie
        </p>
      </div>

      {/* Modals */}
      <NicknameModal
        isOpen={showNicknameModal}
        initialNickname={profile.nickname}
        initialEmoji={profile.emoji}
        onSave={handleSaveProfile}
        onClose={() => setShowNicknameModal(false)}
      />

      <AgeVerification
        isOpen={showAgeModal}
        onConfirm={handleAgeConfirm}
        onReject={() => {
          setContentMode('mierne');
          updateProfile({ contentMode: 'mierne' });
          setShowAgeModal(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
