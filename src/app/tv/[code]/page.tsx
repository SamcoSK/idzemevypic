'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { GlassCard } from '@/components/GlassCard';
import { Timer } from '@/components/Timer';
import { useSocket } from '@/hooks/useSocket';
import type { Lobby, Player } from '@/types';

export default function TVScreenPage() {
  const params = useParams();
  const code = ((params?.code as string) || '').toUpperCase();
  const { socket, isConnected } = useSocket();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [gameResults, setGameResults] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/lobby/${code}`);
    }
  }, [code]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('get_lobby', { code });

    function onLobbyState(data: { lobby: Lobby }) {
      setLobby(data.lobby);
    }
    function onLobbyUpdated(data: { lobby: Lobby }) {
      setLobby(data.lobby);
    }
    function onGameQuestion(data: any) {
      setCurrentQuestion(data);
      setTimeLeft(data.timeLeft || 20);
      setGameResults(null);
    }
    function onTimerTick(data: { timeLeft: number }) {
      setTimeLeft(data.timeLeft);
    }
    function onGameResults(data: any) {
      setGameResults(data);
    }

    socket.on('lobby_state', onLobbyState);
    socket.on('lobby_updated', onLobbyUpdated);
    socket.on('game_question', onGameQuestion);
    socket.on('kto_question', onGameQuestion);
    socket.on('mesto_round', onGameQuestion);
    socket.on('timer_tick', onTimerTick);
    socket.on('game_results', onGameResults);
    socket.on('kto_results', onGameResults);
    socket.on('mesto_results', onGameResults);

    return () => {
      socket.off('lobby_state', onLobbyState);
      socket.off('lobby_updated', onLobbyUpdated);
      socket.off('game_question', onGameQuestion);
      socket.off('kto_question', onGameQuestion);
      socket.off('mesto_round', onGameQuestion);
      socket.off('timer_tick', onTimerTick);
      socket.off('game_results', onGameResults);
      socket.off('kto_results', onGameResults);
      socket.off('mesto_results', onGameResults);
    };
  }, [socket, code]);

  return (
    <div className="min-h-screen bg-vc-dark text-white p-8 flex flex-col justify-between select-none">
      {/* Top TV Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Logo size="md" />
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs uppercase text-vc-gold font-bold">Pripojte sa na mobile cez kód:</p>
            <p className="text-5xl font-display font-black text-vc-pink tracking-widest drop-shadow-[0_0_20px_#FF2E93]">
              {code}
            </p>
          </div>
          {shareUrl && (
            <img
              src={`/api/qr?url=${encodeURIComponent(shareUrl)}`}
              alt="QR kód na TV"
              className="w-24 h-24 rounded-xl border-2 border-vc-teal shadow-[0_0_15px_#00E5D4]"
            />
          )}
        </div>
      </div>

      {/* Main Center Area */}
      <div className="my-auto py-8">
        {currentQuestion ? (
          <div className="space-y-6 text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4">
              <span className="text-lg uppercase font-bold tracking-widest text-vc-teal">
                Kolo {currentQuestion.roundNum || 1}
              </span>
              {timeLeft > 0 && <Timer seconds={timeLeft} totalSeconds={20} />}
            </div>

            {/* Display Question depending on game mode */}
            {currentQuestion.question?.text && (
              <h2 className="text-4xl sm:text-6xl font-display font-black text-white leading-tight drop-shadow-[0_0_25px_#FF2E93]">
                {currentQuestion.question.text}
              </h2>
            )}

            {currentQuestion.question?.moznostA && (
              <div className="grid grid-cols-2 gap-8 pt-4">
                <GlassCard glow="pink" className="p-8 text-left">
                  <span className="text-xs uppercase font-black text-vc-gold">Možnosť A</span>
                  <p className="text-3xl font-bold text-white mt-2 leading-snug">
                    {currentQuestion.question.moznostA}
                  </p>
                </GlassCard>
                <GlassCard glow="teal" className="p-8 text-left">
                  <span className="text-xs uppercase font-black text-vc-teal">Možnosť B</span>
                  <p className="text-3xl font-bold text-white mt-2 leading-snug">
                    {currentQuestion.question.moznostB}
                  </p>
                </GlassCard>
              </div>
            )}

            {currentQuestion.letter && (
              <div className="space-y-4">
                <p className="text-2xl uppercase tracking-widest text-white/70">Písmeno kola:</p>
                <div className="w-36 h-36 mx-auto rounded-3xl bg-gradient-to-br from-vc-pink to-vc-orange flex items-center justify-center font-display text-8xl font-black text-white shadow-[0_0_40px_#FF2E93]">
                  {currentQuestion.letter}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Waiting in Lobby View on TV */
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <span className="text-7xl animate-bounce block">🍹</span>
            <h2 className="text-5xl font-display font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-vc-gold via-vc-pink to-vc-teal drop-shadow-[0_0_20px_rgba(255,46,147,0.8)]">
              Čakáme na hráčov
            </h2>
            <p className="text-xl text-white/80">
              Naskenujte QR kód vpravo hore alebo otvorte{' '}
              <strong className="text-vc-teal font-mono">{shareUrl}</strong> na svojom mobile.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Players Bar */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-vc-gold font-bold">
            Pripojení hráči ({lobby?.players.length || 0} / 12)
          </span>
          <span className="text-xs text-white/50">IdzemeVypic • TV Režim</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {lobby?.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 shadow"
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="text-sm font-bold text-white">{p.nickname}</span>
              {p.isHost && <span className="text-xs">👑</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
