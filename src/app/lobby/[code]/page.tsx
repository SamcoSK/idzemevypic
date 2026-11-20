'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { GlassCard } from '@/components/GlassCard';
import { NeonButton } from '@/components/NeonButton';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { NicknameModal } from '@/components/NicknameModal';
import { useSocket } from '@/hooks/useSocket';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { GAME_MODES, MIN_PLAYERS, ROUND_OPTIONS } from '@/lib/constants';
import { pluralSk } from '@/lib/gameUtils';
import type { Lobby, Player, GameMode } from '@/types';

export default function LobbyPage() {
  const params = useParams();
  const code = ((params?.code as string) || '').toUpperCase();
  const router = useRouter();

  const { socket, isConnected } = useSocket();
  const { profile, updateProfile, playSoundEffect } = usePlayerProfile();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState<number>(10);
  const [nextGameVotes, setNextGameVotes] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  // Determine current player
  const currentPlayer: Player | undefined = lobby?.players.find(
    (p) => p.socketId === socket?.id || p.nickname.toLowerCase() === profile.nickname.toLowerCase()
  );
  const isHost = currentPlayer?.isHost || false;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/lobby/${code}`);
    }
  }, [code]);

  useEffect(() => {
    if (!socket) return;

    // Request lobby state
    socket.emit('get_lobby', { code });

    function onLobbyState(data: { lobby: Lobby }) {
      setLobby(data.lobby);
    }

    function onLobbyUpdated(data: { lobby: Lobby }) {
      setLobby(data.lobby);
    }

    function onPlayerJoined(data: { player: Player; lobby: Lobby }) {
      setLobby(data.lobby);
      playSoundEffect('click');
    }

    function onPlayerLeft(data: { playerId: string; lobby: Lobby }) {
      setLobby(data.lobby);
    }

    function onPlayerKicked(data: { playerId: string }) {
      if (currentPlayer?.id === data.playerId) {
        alert('Bol si vyhodený z lobby.');
        router.push('/');
      }
    }

    function onGameSelected(data: { gameMode: GameMode }) {
      setLobby((prev) => (prev ? { ...prev, gameMode: data.gameMode } : null));
      playSoundEffect('click');
    }

    function onGameStarted(data: { gameId: string; gameMode: GameMode }) {
      playSoundEffect('win');
      router.push(`/game/${data.gameId}`);
    }

    function onNextGameVoteUpdate(data: { tally: Record<string, number> }) {
      setNextGameVotes(data.tally);
    }

    function onError(err: { message: string }) {
      setError(err.message);
      playSoundEffect('wrong');
    }

    socket.on('lobby_state', onLobbyState);
    socket.on('lobby_updated', onLobbyUpdated);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('player_kicked', onPlayerKicked);
    socket.on('game_selected', onGameSelected);
    socket.on('game_started', onGameStarted);
    socket.on('next_game_vote_update', onNextGameVoteUpdate);
    socket.on('error', onError);

    return () => {
      socket.off('lobby_state', onLobbyState);
      socket.off('lobby_updated', onLobbyUpdated);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('player_kicked', onPlayerKicked);
      socket.off('game_selected', onGameSelected);
      socket.off('game_started', onGameStarted);
      socket.off('next_game_vote_update', onNextGameVoteUpdate);
      socket.off('error', onError);
    };
  }, [socket, code, router, currentPlayer?.id, profile.nickname, playSoundEffect]);

  // If lobby loaded and user is not in player list, auto-join if nickname exists or ask for nickname
  useEffect(() => {
    if (!lobby || !socket) return;
    const inLobby = lobby.players.some(
      (p) => p.socketId === socket.id || p.nickname.toLowerCase() === profile.nickname.toLowerCase()
    );

    if (!inLobby) {
      if (profile.nickname) {
        socket.emit('join_lobby', {
          code,
          nickname: profile.nickname,
          emoji: profile.emoji,
        });
      } else {
        setShowNicknameModal(true);
      }
    }
  }, [lobby, socket, code, profile.nickname, profile.emoji]);

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl || code);
      setCopied(true);
      playSoundEffect('click');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectGame = (mode: GameMode) => {
    if (!isHost || !socket) return;
    playSoundEffect('click');
    socket.emit('select_game', { gameMode: mode });
  };

  const handleStartGame = () => {
    if (!isHost || !socket || !lobby?.gameMode) return;
    playSoundEffect('win');
    socket.emit('start_game', {
      rounds: selectedRounds,
      totalRounds: selectedRounds,
    });
  };

  const handleKick = (playerId: string) => {
    if (!isHost || !socket) return;
    if (confirm('Naozaj chceš vyhodiť tohto hráča?')) {
      playSoundEffect('wrong');
      socket.emit('kick_player', { targetId: playerId });
    }
  };

  const handleVoteNextGame = (mode: GameMode) => {
    if (!socket) return;
    playSoundEffect('click');
    socket.emit('vote_next_game', { gameMode: mode });
  };

  const handleSaveNickname = (newNickname: string, newEmoji: string) => {
    updateProfile({ nickname: newNickname, emoji: newEmoji });
    setShowNicknameModal(false);
    if (socket) {
      socket.emit('join_lobby', {
        code,
        nickname: newNickname,
        emoji: newEmoji,
      });
    }
  };

  if (!lobby) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4">
        <Logo size="md" className="mb-6 animate-pulse" />
        <GlassCard glow="teal" className="p-6 text-center max-w-sm w-full space-y-3">
          <p className="text-white font-bold">Pripájanie do lobby {code}...</p>
          <div className="w-8 h-8 border-4 border-vc-teal border-t-transparent rounded-full animate-spin mx-auto" />
        </GlassCard>
      </div>
    );
  }

  const minRequired = lobby.gameMode ? MIN_PLAYERS[lobby.gameMode] || 2 : 2;
  const connectedCount = lobby.players.filter((p) => p.isConnected).length;
  const canStart = isHost && lobby.gameMode && connectedCount >= minRequired;

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => router.push('/')}
          className="text-white/60 hover:text-white text-xs uppercase font-bold flex items-center gap-1"
        >
          ← Späť
        </button>
        <Logo size="sm" />
        <button
          onClick={() => router.push(`/tv/${code}`)}
          className="text-xs uppercase font-bold text-vc-teal hover:underline flex items-center gap-1"
          title="Otvoriť TV obrazovku"
        >
          📺 TV Mód
        </button>
      </div>

      {/* Lobby Code & Share Card */}
      <GlassCard glow="pink" className="text-center p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-vc-gold font-bold">
            Kód tvojej lobby
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-vc-pink/20 border border-vc-pink/40 text-vc-pink font-semibold">
            {lobby.contentMode === 'odvazne' ? '🔞 18+' : lobby.contentMode === 'mix' ? '🍹 Mix' : '😇 Mierne'}
          </span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl font-display font-black tracking-widest text-white drop-shadow-[0_0_15px_#FF2E93]">
            {lobby.code}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition-transform text-lg"
            title="Kopírovať odkaz"
          >
            {copied ? '✅' : '📋'}
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition-transform text-lg"
            title="Zobraziť QR kód"
          >
            📱
          </button>
        </div>

        {/* QR Code toggle */}
        {showQR && (
          <div className="p-3 bg-black/60 rounded-xl border border-white/20 flex flex-col items-center space-y-2 animate-slide-down">
            <img
              src={`/api/qr?url=${encodeURIComponent(shareUrl)}`}
              alt="QR kód lobby"
              className="w-48 h-48 rounded-lg shadow-[0_0_20px_#FF2E93]"
            />
            <p className="text-[11px] text-white/70">
              Kamoši v rovnakej Wi-Fi môžu naskenovať tento QR kód
            </p>
          </div>
        )}
      </GlassCard>

      {/* Players List Card */}
      <GlassCard glow="teal" className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-bold tracking-wider text-vc-teal">
            Hráči v lobby ({pluralSk(lobby.players.length, 'hráč', 'hráči', 'hráčov')})
          </h3>
          <span className="text-[11px] text-white/50">max 12</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
          {lobby.players.map((p) => (
            <div key={p.id} className="relative group">
              <PlayerAvatar
                nickname={p.nickname}
                emoji={p.emoji}
                isHost={p.isHost}
                isConnected={p.isConnected}
                size="md"
                subtitle={p.id === currentPlayer?.id ? '(Ty)' : undefined}
              />
              {isHost && p.id !== currentPlayer?.id && (
                <button
                  onClick={() => handleKick(p.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 text-xs px-2 py-1 rounded bg-red-600/30 border border-red-500/50 text-red-200"
                  title="Vyhodiť hráča"
                >
                  Vyhodiť
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Game Mode Selection (Host or Voting) */}
      <GlassCard glow="orange" className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-bold tracking-wider text-vc-gold">
            {isHost ? '👑 Vyber minihru pre kolo:' : 'Hlasuj za obľúbenú hru:'}
          </h3>
          {lobby.gameMode && (
            <span className="text-[11px] text-vc-teal font-semibold">
              Min {MIN_PLAYERS[lobby.gameMode]} hráči
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {GAME_MODES.map((modeInfo) => {
            const isSelected = lobby.gameMode === modeInfo.value;
            const votes = nextGameVotes[modeInfo.value] || 0;

            return (
              <button
                key={modeInfo.value}
                type="button"
                onClick={() => {
                  if (isHost) handleSelectGame(modeInfo.value);
                  else handleVoteNextGame(modeInfo.value);
                }}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-vc-pink/40 to-vc-orange/40 border-vc-pink shadow-[0_0_15px_rgba(255,46,147,0.7)] scale-[1.02]'
                    : 'bg-black/30 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">{modeInfo.icon}</span>
                  {votes > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-vc-teal/20 text-vc-teal border border-vc-teal/40">
                      {votes} {votes === 1 ? 'hlas' : 'hlasy'}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white leading-tight">
                  {modeInfo.label}
                </p>
                <p className="text-[10px] text-white/60 mt-0.5 line-clamp-1">
                  {modeInfo.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Round selector for Host if game with rounds */}
        {isHost && lobby.gameMode && (
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-white/70 font-semibold">Počet kôl:</span>
            <div className="flex gap-1.5">
              {(lobby.gameMode === 'kto-by-najskor' ? [5, 10, 15] : [3, 5, 7]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRounds(r)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    selectedRounds === r
                      ? 'bg-vc-teal text-vc-dark font-black shadow-[0_0_8px_#00E5D4]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Start Button / Waiting Banner */}
      <div className="pt-1">
        {error && (
          <p className="text-xs text-red-400 font-semibold text-center mb-2">
            {error}
          </p>
        )}

        {isHost ? (
          <NeonButton
            variant="primary"
            fullWidth
            size="lg"
            pulsing={!!canStart}
            disabled={!canStart}
            onClick={handleStartGame}
          >
            {!lobby.gameMode
              ? '👆 Vyber minihru vyššie'
              : connectedCount < minRequired
              ? `Čakáme na hráčov (min ${minRequired})`
              : '🚀 Spustiť hru!'}
          </NeonButton>
        ) : (
          <div className="p-3.5 rounded-xl bg-vc-dark/70 border border-vc-teal/30 text-center space-y-1">
            <p className="text-sm font-bold text-vc-teal animate-pulse">
              Čakáme na hostiteľa...
            </p>
            <p className="text-xs text-white/60">
              Hostiteľ čoskoro vyberie minihru a odštartuje zábavu.
            </p>
          </div>
        )}
      </div>

      <NicknameModal
        isOpen={showNicknameModal}
        initialNickname={profile.nickname}
        initialEmoji={profile.emoji}
        onSave={handleSaveNickname}
      />
    </div>
  );
}
