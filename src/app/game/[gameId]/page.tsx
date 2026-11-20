'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { GlassCard } from '@/components/GlassCard';
import { NeonButton } from '@/components/NeonButton';
import { Timer } from '@/components/Timer';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useSocket } from '@/hooks/useSocket';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import type { GameMode, Player, Question } from '@/types';

export default function GamePage() {
  const params = useParams();
  const gameId = params?.gameId as string;
  const router = useRouter();

  const { socket, isConnected } = useSocket();
  const { profile, playSoundEffect, triggerVibration } = usePlayerProfile();

  // Generic Game States
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [roundNum, setRoundNum] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(10);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [gameStatus, setGameStatus] = useState<'playing' | 'voting' | 'results' | 'finished'>('playing');

  // Co by si radsej states
  const [coByQuestion, setCoByQuestion] = useState<{ id: any; moznostA: string; moznostB: string; text?: string } | null>(null);
  const [myChoice, setMyChoice] = useState<'A' | 'B' | null>(null);
  const [myPrediction, setMyPrediction] = useState<'A' | 'B' | null>(null);
  const [coByResults, setCoByResults] = useState<any>(null);

  // Podvodnik states
  const [myRole, setMyRole] = useState<'spy' | 'player' | null>(null);
  const [secretWord, setSecretWord] = useState<string | null>(null);
  const [podvodnikPhase, setPodvodnikPhase] = useState<'hints' | 'vote' | 'spy_guess' | 'results'>('hints');
  const [myHint, setMyHint] = useState('');
  const [hintSubmitted, setHintSubmitted] = useState(false);
  const [allHints, setAllHints] = useState<Array<{ playerId: string; hint: string }>>([]);
  const [votedSpyId, setVotedSpyId] = useState<string | null>(null);
  const [spyGuessWord, setSpyGuessWord] = useState('');
  const [podvodnikResults, setPodvodnikResults] = useState<any>(null);

  // Kto by najskor states
  const [ktoQuestion, setKtoQuestion] = useState<Question | null>(null);
  const [ktoCandidates, setKtoCandidates] = useState<Array<{ id: string; nickname: string; emoji: string }>>([]);
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);
  const [ktoResults, setKtoResults] = useState<any>(null);

  // Mesto stat rieka states
  const [mestoLetter, setMestoLetter] = useState<string>('A');
  const [mestoCategories, setMestoCategories] = useState<Array<{ id: string; nazov: string; priklad: string }>>([]);
  const [mestoAnswers, setMestoAnswers] = useState<Record<string, string>>({});
  const [mestoSubmitted, setMestoSubmitted] = useState(false);
  const [mestoResults, setMestoResults] = useState<any>(null);
  const [stoppedByPlayer, setStoppedByPlayer] = useState<string | null>(null);

  // Final scores / podium
  const [finalScores, setFinalScores] = useState<Record<string, number> | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Timer ticks
    function onTimerTick(data: { timeLeft: number }) {
      setTimeLeft(data.timeLeft);
      if (data.timeLeft <= 3 && data.timeLeft > 0) {
        playSoundEffect('timer');
        triggerVibration(40);
      }
    }

    // Co by si radsej questions
    function onGameQuestion(data: any) {
      setRoundNum(data.roundNum || 1);
      setTotalRounds(data.totalRounds || 3);
      setTimeLeft(data.timeLeft || 20);
      setGameStatus('voting');
      setMyChoice(null);
      setMyPrediction(null);
      setCoByResults(null);
      setKtoResults(null);
      setMestoResults(null);

      if (data.question?.moznostA) {
        setGameMode('co-by-radej');
        setCoByQuestion(data.question);
      } else if (data.candidates) {
        setGameMode('kto-by-najskor');
        setKtoQuestion(data.question);
        setKtoCandidates(data.candidates);
        setVotedCandidateId(null);
      } else if (data.letter) {
        setGameMode('mesto-stat-rieka');
        setMestoLetter(data.letter);
        setMestoCategories(data.categories || []);
        setMestoAnswers({});
        setMestoSubmitted(false);
        setStoppedByPlayer(null);
      }
    }

    // Co by si radsej results
    function onGameResults(data: any) {
      setGameStatus('results');
      playSoundEffect('correct');
      triggerVibration([50, 50, 50]);

      if (data.percentA !== undefined) {
        setGameMode('co-by-radej');
        setCoByResults(data);
      } else if (data.rankings) {
        setGameMode('kto-by-najskor');
        setKtoResults(data);
      } else if (data.spyId) {
        setGameMode('podvodnik');
        setPodvodnikResults(data);
      } else if (data.categoryDetails) {
        setGameMode('mesto-stat-rieka');
        setMestoResults(data);
      }
    }

    // Podvodnik specific
    function onYourRole(data: { gameId: string; role: 'spy' | 'player'; word?: string }) {
      setGameMode('podvodnik');
      setMyRole(data.role);
      setSecretWord(data.word || null);
      setPodvodnikPhase('hints');
      setHintSubmitted(false);
      setMyHint('');
      setAllHints([]);
      setVotedSpyId(null);
      setSpyGuessWord('');
      setPodvodnikResults(null);
      playSoundEffect('correct');
    }

    function onPhaseChange(data: { phase: 'hints' | 'vote' | 'spy_guess' | 'results'; timeLeft: number }) {
      setPodvodnikPhase(data.phase);
      setTimeLeft(data.timeLeft);
      playSoundEffect('click');
    }

    function onHintSubmitted(data: { playerId: string; hint: string }) {
      setAllHints((prev) => [...prev, data]);
    }

    // Kto by najskor specific
    function onKtoQuestion(data: any) {
      setGameMode('kto-by-najskor');
      setKtoQuestion(data.question);
      setKtoCandidates(data.candidates);
      setRoundNum(data.roundNum);
      setTotalRounds(data.totalRounds);
      setTimeLeft(data.timeLeft);
      setGameStatus('voting');
      setVotedCandidateId(null);
      setKtoResults(null);
    }

    function onKtoResults(data: any) {
      setGameStatus('results');
      setKtoResults(data);
      playSoundEffect('win');
      triggerVibration([100, 50, 100]);
    }

    // Mesto stat rieka specific
    function onMestoRound(data: any) {
      setGameMode('mesto-stat-rieka');
      setMestoLetter(data.letter);
      setMestoCategories(data.categories);
      setRoundNum(data.roundNum);
      setTotalRounds(data.totalRounds);
      setTimeLeft(data.timeLeft);
      setGameStatus('playing');
      setMestoAnswers({});
      setMestoSubmitted(false);
      setMestoResults(null);
      setStoppedByPlayer(null);
    }

    function onPlayerStopped(data: { nickname: string; emoji: string }) {
      setStoppedByPlayer(`${data.emoji} ${data.nickname}`);
      playSoundEffect('wrong');
      triggerVibration(150);
    }

    // Universal Game Finished
    function onGameFinished(data: { finalScores: Record<string, number>; winner: string | null }) {
      setGameStatus('finished');
      setFinalScores(data.finalScores);
      setWinnerId(data.winner);
      playSoundEffect('win');
      triggerVibration([100, 100, 200, 100, 300]);
    }

    function onReturnedToLobby(data: { lobby: { code: string } }) {
      router.push(`/lobby/${data.lobby.code}`);
    }

    socket.on('timer_tick', onTimerTick);
    socket.on('game_question', onGameQuestion);
    socket.on('game_results', onGameResults);
    socket.on('your_role', onYourRole);
    socket.on('phase_change', onPhaseChange);
    socket.on('hint_submitted', onHintSubmitted);
    socket.on('kto_question', onKtoQuestion);
    socket.on('kto_results', onKtoResults);
    socket.on('mesto_round', onMestoRound);
    socket.on('player_stopped', onPlayerStopped);
    socket.on('game_finished', onGameFinished);
    socket.on('returned_to_lobby', onReturnedToLobby);

    return () => {
      socket.off('timer_tick', onTimerTick);
      socket.off('game_question', onGameQuestion);
      socket.off('game_results', onGameResults);
      socket.off('your_role', onYourRole);
      socket.off('phase_change', onPhaseChange);
      socket.off('hint_submitted', onHintSubmitted);
      socket.off('kto_question', onKtoQuestion);
      socket.off('kto_results', onKtoResults);
      socket.off('mesto_round', onMestoRound);
      socket.off('player_stopped', onPlayerStopped);
      socket.off('game_finished', onGameFinished);
      socket.off('returned_to_lobby', onReturnedToLobby);
    };
  }, [socket, router, playSoundEffect, triggerVibration]);

  // Handlers for Co by si radsej
  const submitCoByVote = (choice: 'A' | 'B', prediction: 'A' | 'B') => {
    if (!socket || myChoice) return;
    setMyChoice(choice);
    setMyPrediction(prediction);
    playSoundEffect('click');
    triggerVibration(50);
    socket.emit('cast_vote', {
      gameId,
      choice,
      prediction,
    });
  };

  // Handlers for Podvodnik
  const submitHint = () => {
    if (!socket || !myHint.trim() || hintSubmitted) return;
    setHintSubmitted(true);
    playSoundEffect('click');
    socket.emit('submit_hint', { gameId, hint: myHint.trim() });
  };

  const voteSpy = (targetId: string) => {
    if (!socket || votedSpyId) return;
    setVotedSpyId(targetId);
    playSoundEffect('click');
    socket.emit('vote_spy', { gameId, targetId });
  };

  const submitSpyGuess = () => {
    if (!socket || !spyGuessWord.trim()) return;
    playSoundEffect('click');
    socket.emit('guess_word', { gameId, guess: spyGuessWord.trim() });
  };

  // Handlers for Kto by najskor
  const voteKtoCandidate = (targetId: string) => {
    if (!socket || votedCandidateId) return;
    setVotedCandidateId(targetId);
    playSoundEffect('click');
    triggerVibration(50);
    socket.emit('cast_vote', { gameId, targetId });
  };

  // Handlers for Mesto stat rieka
  const submitMestoAnswers = (finishedEarly: boolean = false) => {
    if (!socket || mestoSubmitted) return;
    if (finishedEarly) setMestoSubmitted(true);
    playSoundEffect('click');
    socket.emit('submit_answers', {
      gameId,
      answers: mestoAnswers,
      finishedEarly,
    });
  };

  const handleReturnToLobby = () => {
    if (!socket) return;
    playSoundEffect('click');
    socket.emit('return_to_lobby');
  };

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: GAME FINISHED / PODIUM
  // ──────────────────────────────────────────────────────────────────────────
  if (gameStatus === 'finished') {
    const sortedScores = Object.entries(finalScores || {}).sort((a, b) => b[1] - a[1]);

    return (
      <div className="min-h-dvh flex flex-col justify-between p-4 max-w-md mx-auto space-y-6">
        <Logo size="sm" className="mt-2" />

        <GlassCard glow="orange" className="p-6 text-center space-y-5 animate-scale-up">
          <div className="space-y-1">
            <span className="text-4xl animate-bounce">🏆</span>
            <h2 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-vc-gold to-vc-pink uppercase">
              Koniec Hry!
            </h2>
            <p className="text-xs text-white/70">Záverečné bodovanie a poradie</p>
          </div>

          {/* Podium (Top 3) */}
          <div className="flex items-end justify-center gap-2 pt-4 pb-2">
            {sortedScores[1] && (
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl">🥈</span>
                <span className="text-xs font-bold text-white truncate max-w-[80px]">
                  {sortedScores[1][0]}
                </span>
                <div className="w-full h-16 bg-white/10 rounded-t-xl border-t border-white/20 flex items-center justify-center font-bold text-white text-sm">
                  {sortedScores[1][1]} b
                </div>
              </div>
            )}
            {sortedScores[0] && (
              <div className="flex flex-col items-center flex-1 -mb-1">
                <span className="text-3xl animate-bounce">👑 🥇</span>
                <span className="text-sm font-black text-vc-gold truncate max-w-[100px]">
                  {sortedScores[0][0]}
                </span>
                <div className="w-full h-24 bg-gradient-to-t from-vc-pink/40 to-vc-gold/40 rounded-t-xl border-t-2 border-vc-gold flex items-center justify-center font-black text-vc-gold text-lg shadow-[0_0_20px_#FFC857]">
                  {sortedScores[0][1]} b
                </div>
              </div>
            )}
            {sortedScores[2] && (
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl">🥉</span>
                <span className="text-xs font-bold text-white truncate max-w-[80px]">
                  {sortedScores[2][0]}
                </span>
                <div className="w-full h-12 bg-white/5 rounded-t-xl border-t border-white/10 flex items-center justify-center font-bold text-white text-xs">
                  {sortedScores[2][1]} b
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <NeonButton variant="primary" fullWidth size="lg" onClick={handleReturnToLobby}>
              🏠 Späť do lobby
            </NeonButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: MINI-GAME 1 – ČO BY SI RADŠEJ?
  // ──────────────────────────────────────────────────────────────────────────
  if (gameMode === 'co-by-radej') {
    return (
      <div className="min-h-dvh flex flex-col justify-between p-4 max-w-md mx-auto space-y-4">
        {/* Top Bar: Round & Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-vc-teal">
              Kolo {roundNum} / {totalRounds}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-vc-pink/20 text-vc-pink border border-vc-pink/40 font-semibold">
              Čo by si radšej?
            </span>
          </div>
          <Timer seconds={timeLeft} totalSeconds={20} />
        </div>

        {/* Question & Choices */}
        {gameStatus === 'voting' && coByQuestion && (
          <div className="space-y-4 my-auto">
            <h2 className="text-center font-display text-xl sm:text-2xl font-black text-white drop-shadow-[0_0_12px_rgba(255,46,147,0.7)]">
              Čo by si radšej vybral/a?
            </h2>

            {/* Option A */}
            <button
              onClick={() => submitCoByVote('A', myPrediction || 'A')}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                myChoice === 'A'
                  ? 'bg-gradient-to-r from-vc-pink to-vc-magenta border-white shadow-[0_0_25px_#FF2E93] scale-[1.02]'
                  : 'bg-vc-dark/80 border-vc-pink/60 hover:border-vc-pink active:scale-95'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase font-black tracking-widest text-vc-gold">
                  Možnosť A
                </span>
                {myChoice === 'A' && <span className="text-lg">✓ Tvoj výber</span>}
              </div>
              <p className="text-lg font-bold text-white leading-snug">
                {coByQuestion.moznostA}
              </p>
            </button>

            {/* OR separator */}
            <div className="text-center">
              <span className="text-xs uppercase font-black text-vc-gold tracking-widest px-3 py-1 bg-black/50 rounded-full border border-white/20">
                ALEBO
              </span>
            </div>

            {/* Option B */}
            <button
              onClick={() => submitCoByVote('B', myPrediction || 'B')}
              className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                myChoice === 'B'
                  ? 'bg-gradient-to-r from-vc-teal to-blue-600 border-white shadow-[0_0_25px_#00E5D4] scale-[1.02]'
                  : 'bg-vc-dark/80 border-vc-teal/60 hover:border-vc-teal active:scale-95'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase font-black tracking-widest text-vc-teal">
                  Možnosť B
                </span>
                {myChoice === 'B' && <span className="text-lg">✓ Tvoj výber</span>}
              </div>
              <p className="text-lg font-bold text-white leading-snug">
                {coByQuestion.moznostB}
              </p>
            </button>

            {/* Bonus Prediction */}
            <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-center space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-vc-gold font-bold">
                🎯 Bonus: Tipni, čo vyberie väčšina (+100 b)
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMyPrediction('A')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    myPrediction === 'A'
                      ? 'bg-vc-pink text-white shadow-[0_0_10px_#FF2E93]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Väčšina vyberie A
                </button>
                <button
                  type="button"
                  onClick={() => setMyPrediction('B')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    myPrediction === 'B'
                      ? 'bg-vc-teal text-vc-dark shadow-[0_0_10px_#00E5D4]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Väčšina vyberie B
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {gameStatus === 'results' && coByResults && (
          <GlassCard glow="pink" className="p-5 space-y-4 my-auto text-center animate-slide-down">
            <h3 className="font-display text-xl font-bold text-white uppercase">
              Výsledky kola {roundNum}
            </h3>

            {/* Visual Bar Comparison */}
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-vc-pink">{coByResults.percentA}% Možnosť A</span>
                <span className="text-vc-teal">{coByResults.percentB}% Možnosť B</span>
              </div>
              <div className="h-6 w-full rounded-full bg-black/50 overflow-hidden flex border border-white/20">
                <div
                  className="bg-gradient-to-r from-vc-pink to-vc-magenta transition-all duration-1000 flex items-center justify-start pl-2 text-[10px] font-black text-white"
                  style={{ width: `${coByResults.percentA}%` }}
                >
                  {coByResults.votesA} hl.
                </div>
                <div
                  className="bg-gradient-to-r from-vc-teal to-blue-500 transition-all duration-1000 flex items-center justify-end pr-2 text-[10px] font-black text-vc-dark"
                  style={{ width: `${coByResults.percentB}%` }}
                >
                  {coByResults.votesB} hl.
                </div>
              </div>
            </div>

            <p className="text-xs text-white/80 font-medium">
              Víťazná väčšina: <strong className="text-vc-gold uppercase">{coByResults.majority}</strong>
            </p>
            <p className="text-xs text-vc-teal font-semibold">Ďalšie kolo o chvíľu...</p>
          </GlassCard>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: MINI-GAME 2 – PODVODNÍK
  // ──────────────────────────────────────────────────────────────────────────
  if (gameMode === 'podvodnik') {
    return (
      <div className="min-h-dvh flex flex-col justify-between p-4 max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-vc-teal">
            Minihra: Podvodník
          </span>
          <Timer seconds={timeLeft} totalSeconds={podvodnikPhase === 'hints' ? 60 : 30} />
        </div>

        {/* Phase 1: Hints */}
        {podvodnikPhase === 'hints' && (
          <div className="space-y-4 my-auto">
            {/* Secret Role Card */}
            <GlassCard glow={myRole === 'spy' ? 'pink' : 'teal'} className="p-4 text-center space-y-2">
              <span className="text-3xl">{myRole === 'spy' ? '🕵️‍♂️' : '🤫'}</span>
              <h2 className="text-lg font-bold font-display uppercase text-white">
                {myRole === 'spy' ? 'Ty si PODVODNÍK!' : 'Tajné slovo pre občanov:'}
              </h2>
              {myRole === 'spy' ? (
                <p className="text-xs text-red-300 font-semibold">
                  Nepoznáš slovo! Počúvaj nápovede ostatných a snaž sa nevzbudiť podozrenie.
                </p>
              ) : (
                <p className="text-2xl font-black font-display text-vc-gold drop-shadow-[0_0_12px_#FFC857]">
                  {secretWord}
                </p>
              )}
            </GlassCard>

            {/* Hint Input */}
            {!hintSubmitted ? (
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-vc-gold">
                  Napíš svoju nápovedu (max 50 znakov):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={myHint}
                    onChange={(e) => setMyHint(e.target.value)}
                    placeholder="Napr. Je to studené..."
                    maxLength={50}
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium outline-none focus:border-vc-teal"
                  />
                  <NeonButton variant="primary" size="md" onClick={submitHint}>
                    Odoslať
                  </NeonButton>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-vc-teal font-semibold">
                ✓ Nápoveda odoslaná! Čakáme na ostatných...
              </p>
            )}

            {/* Feed of submitted hints */}
            <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-1.5 max-h-48 overflow-y-auto">
              <p className="text-[11px] uppercase tracking-wider text-white/50 font-bold mb-1">
                Nápovede hráčov ({allHints.length}):
              </p>
              {allHints.map((h, i) => (
                <div key={i} className="text-xs text-white/90 bg-white/5 p-2 rounded-lg">
                  💬 <strong className="text-vc-teal">{h.playerId.slice(0, 6)}:</strong> „{h.hint}“
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 2: Vote */}
        {podvodnikPhase === 'vote' && (
          <div className="space-y-4 my-auto text-center">
            <h2 className="font-display text-xl font-bold text-white uppercase drop-shadow-[0_0_12px_#FF2E93]">
              Kto je podvodník?
            </h2>
            <p className="text-xs text-white/70">
              Hlasuj za hráča, ktorého nápoveda bola najviac podozrivá.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {allHints.map((h) => (
                <button
                  key={h.playerId}
                  onClick={() => voteSpy(h.playerId)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    votedSpyId === h.playerId
                      ? 'bg-vc-pink border-white shadow-[0_0_15px_#FF2E93]'
                      : 'bg-vc-dark/80 border-white/20 hover:border-white/50'
                  }`}
                >
                  <p className="text-sm font-bold text-white truncate">
                    {h.playerId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-white/70 mt-1 italic">
                    „{h.hint}“
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: Spy Guess */}
        {podvodnikPhase === 'spy_guess' && (
          <div className="space-y-4 my-auto text-center">
            {myRole === 'spy' ? (
              <GlassCard glow="pink" className="p-5 space-y-3">
                <span className="text-4xl">🕵️‍♂️</span>
                <h3 className="font-display text-lg font-bold text-white uppercase">
                  Uhádni tajné slovo pre bonusové body!
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spyGuessWord}
                    onChange={(e) => setSpyGuessWord(e.target.value)}
                    placeholder="Tvoj tip slova..."
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium outline-none focus:border-vc-pink"
                  />
                  <NeonButton variant="primary" size="md" onClick={submitSpyGuess}>
                    Tipnúť
                  </NeonButton>
                </div>
              </GlassCard>
            ) : (
              <GlassCard glow="teal" className="p-5 space-y-2 text-center">
                <p className="text-sm font-bold text-vc-teal animate-pulse">
                  Podvodník sa pokúša uhádnuť slovo...
                </p>
                <p className="text-xs text-white/60">Čakáme na jeho odpoveď.</p>
              </GlassCard>
            )}
          </div>
        )}

        {/* Phase 4: Results */}
        {podvodnikPhase === 'results' && podvodnikResults && (
          <GlassCard glow="orange" className="p-5 space-y-3 text-center animate-slide-down">
            <h3 className="font-display text-xl font-bold text-white uppercase">
              Odhalenie Podvodníka!
            </h3>
            <p className="text-sm text-white/90">
              Tajné slovo bolo: <strong className="text-vc-gold uppercase text-lg">{podvodnikResults.word}</strong>
            </p>
            <p className="text-xs text-white/70">
              Podvodník bol: <strong className="text-vc-pink">{podvodnikResults.spyId?.slice(0, 8)}</strong>
            </p>
            <p className="text-xs text-vc-teal font-semibold">
              {podvodnikResults.spyCaught
                ? '🎉 Podvodník bol úspešne odhalený!'
                : '🕵️‍♂️ Podvodník oklamal všetkých!'}
            </p>
          </GlassCard>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: MINI-GAME 3 – KTO BY NAJSKÔR...?
  // ──────────────────────────────────────────────────────────────────────────
  if (gameMode === 'kto-by-najskor') {
    return (
      <div className="min-h-dvh flex flex-col justify-between p-4 max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-vc-teal">
              Kolo {roundNum} / {totalRounds}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-vc-orange/20 text-vc-gold border border-vc-gold/40 font-semibold">
              Kto by najskôr...?
            </span>
          </div>
          <Timer seconds={timeLeft} totalSeconds={20} />
        </div>

        {/* Question & Player Voting Grid */}
        {gameStatus === 'voting' && ktoQuestion && (
          <div className="space-y-4 my-auto">
            <GlassCard glow="pink" className="p-5 text-center space-y-2">
              <span className="text-xs uppercase font-bold tracking-widest text-vc-gold">
                Otázka kola:
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-[0_0_15px_rgba(255,46,147,0.8)]">
                {ktoQuestion.text}
              </h2>
            </GlassCard>

            <div className="space-y-2">
              <p className="text-xs text-center text-white/70 font-semibold">
                Tajne hlasuj za jedného hráča (za seba nemôžeš):
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {ktoCandidates
                  .filter((c) => c.nickname.toLowerCase() !== profile.nickname.toLowerCase())
                  .map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() => voteKtoCandidate(candidate.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        votedCandidateId === candidate.id
                          ? 'bg-gradient-to-r from-vc-pink to-vc-orange border-white shadow-[0_0_20px_#FF2E93] scale-[1.02]'
                          : 'bg-vc-dark/80 border-white/20 hover:border-white/50 active:scale-95'
                      }`}
                    >
                      <span className="text-2xl">{candidate.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">
                          {candidate.nickname}
                        </p>
                        {votedCandidateId === candidate.id && (
                          <span className="text-[10px] uppercase font-black text-vc-gold">
                            ✓ Tvoj hlas
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {gameStatus === 'results' && ktoResults && (
          <GlassCard glow="orange" className="p-5 space-y-4 my-auto text-center animate-slide-down">
            <div className="space-y-1">
              <span className="text-3xl animate-bounce">👑</span>
              <h3 className="font-display text-xl font-black text-white uppercase drop-shadow-[0_0_12px_#FFC857]">
                {ktoResults.winnerTitle}
              </h3>
              <p className="text-xs text-white/70 italic">
                „{ktoResults.question?.text}“
              </p>
            </div>

            {/* Ranking Breakdown */}
            <div className="space-y-2 py-2 max-h-56 overflow-y-auto">
              {ktoResults.rankings?.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    r.isWinner
                      ? 'bg-vc-pink/30 border-vc-pink shadow-[0_0_10px_rgba(255,46,147,0.5)]'
                      : 'bg-black/30 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{r.player?.emoji}</span>
                    <span className="text-sm font-bold text-white">
                      {r.player?.nickname}
                    </span>
                  </div>
                  <span className="text-xs font-black text-vc-gold">
                    {r.voteCount} {r.voteCount === 1 ? 'hlas' : 'hlasov'}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-vc-teal font-semibold">
              Hráči, ktorí hlasovali so zhodou väčšiny, získali +50 bodov!
            </p>
          </GlassCard>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW: MINI-GAME 4 – MESTO-ŠTÁT-RIEKA
  // ──────────────────────────────────────────────────────────────────────────
  if (gameMode === 'mesto-stat-rieka') {
    return (
      <div className="min-h-dvh flex flex-col justify-between p-4 max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-vc-teal">
              Kolo {roundNum} / {totalRounds}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 font-semibold">
              Mesto-štát-rieka
            </span>
          </div>
          <Timer seconds={timeLeft} totalSeconds={60} />
        </div>

        {/* Active Round Inputs */}
        {gameStatus === 'playing' && (
          <div className="space-y-3 my-auto">
            {/* Big Neon Letter Badge */}
            <div className="text-center">
              <span className="text-xs uppercase font-bold tracking-widest text-white/70">
                Písmeno tohto kola:
              </span>
              <div className="w-20 h-20 mx-auto mt-1 rounded-2xl bg-gradient-to-br from-vc-pink to-vc-orange border-2 border-white flex items-center justify-center font-display text-5xl font-black text-white shadow-[0_0_25px_#FF2E93] animate-pulse">
                {mestoLetter}
              </div>
            </div>

            {stoppedByPlayer && (
              <div className="p-2 rounded-xl bg-vc-pink/30 border border-vc-pink text-center text-xs font-bold text-white animate-shake">
                ⚠️ Hráč {stoppedByPlayer} klikol STOP! Máš 10 sekúnd na dokončenie!
              </div>
            )}

            {/* Input list for categories */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {mestoCategories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-vc-teal flex justify-between">
                    <span>{cat.nazov}</span>
                    <span className="text-white/40 lowercase">napr. {cat.priklad}</span>
                  </label>
                  <input
                    type="text"
                    value={mestoAnswers[cat.id] || ''}
                    disabled={mestoSubmitted}
                    onChange={(e) => {
                      setMestoAnswers({
                        ...mestoAnswers,
                        [cat.id]: e.target.value,
                      });
                    }}
                    placeholder={`Začína na ${mestoLetter}...`}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-vc-teal text-sm"
                  />
                </div>
              ))}
            </div>

            {/* STOP / SUBMIT Button */}
            <NeonButton
              variant="primary"
              fullWidth
              size="lg"
              disabled={mestoSubmitted}
              onClick={() => submitMestoAnswers(true)}
            >
              {mestoSubmitted ? '✓ Odpovede odoslané' : '🛑 STOP! Mám hotovo'}
            </NeonButton>
          </div>
        )}

        {/* Results Screen */}
        {gameStatus === 'results' && mestoResults && (
          <GlassCard glow="teal" className="p-5 space-y-4 my-auto text-center animate-slide-down">
            <h3 className="font-display text-xl font-bold text-white uppercase">
              Výsledky pre písmeno „{mestoLetter}“
            </h3>
            <p className="text-xs text-white/70">
              Unikátna odpoveď = 100 b • Zdieľaná odpoveď = 50 b
            </p>

            <div className="space-y-2 py-2 max-h-60 overflow-y-auto">
              {mestoCategories.map((cat) => {
                const myAns = mestoAnswers[cat.id] || '(nevyplnené)';
                return (
                  <div key={cat.id} className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-left">
                    <span className="text-[10px] uppercase font-bold text-vc-gold block">
                      {cat.nazov}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      „{myAns}“
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-vc-teal font-semibold">
              Ďalšie kolo o chvíľu...
            </p>
          </GlassCard>
        )}
      </div>
    );
  }

  // Fallback loading / waiting
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4">
      <Logo size="md" className="mb-6 animate-pulse" />
      <GlassCard glow="pink" className="p-6 text-center max-w-sm w-full space-y-3">
        <p className="text-white font-bold">Pripravujem hru...</p>
        <div className="w-8 h-8 border-4 border-vc-pink border-t-transparent rounded-full animate-spin mx-auto" />
      </GlassCard>
    </div>
  );
}
