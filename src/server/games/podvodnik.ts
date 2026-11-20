import type { Server, Socket } from 'socket.io';
import type { Player, ContentMode } from '@/types';
import { startGame, getGame, updateScore, endGame, type ExtendedGameState } from './gameManager';
import { pickSpyWord } from './questionPicker';

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = 'hints' | 'vote' | 'spy_guess' | 'results';

interface PodvodnikState extends ExtendedGameState {
  spyId: string;
  currentWord: string;
  hints: Record<string, string>; // playerId → hint
  votes: Record<string, string>; // voterId → targetId
  spyGuess: string;
  phase: Phase;
  phaseTimer?: ReturnType<typeof setInterval>;
}

function sanitize(str: string): string {
  return String(str).replace(/[<>&"'`]/g, '').slice(0, 50);
}

export function runPodvodnik(
  io: Server,
  lobbyCode: string,
  players: Player[],
  contentMode: ContentMode
) {
  const game = startGame(lobbyCode, 'podvodnik', players, contentMode, 1) as PodvodnikState;
  game.hints = {};
  game.votes = {};
  game.spyGuess = '';
  game.phase = 'hints';

  const room = lobbyCode;
  const roomAlt = `lobby:${lobbyCode}`;

  function emitToRoom(event: string, data: any) {
    io.to(room).emit(event, data);
    io.to(roomAlt).emit(event, data);
  }

  // Pick a spy word
  const wordObj = pickSpyWord([], contentMode);
  if (!wordObj) {
    io.to(room).emit('error', { message: 'No spy words available', code: 'NO_WORDS' });
    return null;
  }

  game.currentWord = wordObj.slovo;

  // Randomly assign spy
  const connected = players.filter((p) => p.isConnected);
  const spyIndex = Math.floor(Math.random() * connected.length);
  const spy = connected[spyIndex];
  game.spyId = spy.id;

  // Send private role to each player
  for (const player of connected) {
    const role = player.id === spy.id ? 'spy' : 'player';
    const socketId = player.socketId;
    io.to(socketId).emit('your_role', {
      gameId: game.id,
      role,
      word: role === 'player' ? game.currentWord : undefined,
    });
  }

  function broadcastPhase(phase: Phase, timeLeft: number) {
    game.phase = phase;
    emitToRoom('phase_change', { gameId: game.id, phase, timeLeft });
  }

  // ── Phase 1: Hints (60s) ──────────────────────────────────────────────────
  broadcastPhase('hints', 60);
  let hintsTimeLeft = 60;

  const hintsTick = setInterval(() => {
    hintsTimeLeft--;
    emitToRoom('timer_tick', { timeLeft: hintsTimeLeft });
    if (hintsTimeLeft <= 0) {
      clearInterval(hintsTick);
      startVotePhase();
    }
  }, 1000);

  game.phaseTimer = hintsTick;

  function checkAllHintsIn() {
    const allIn = connected.every((p) => game.hints[p.id] !== undefined);
    if (allIn) {
      clearInterval(hintsTick);
      startVotePhase();
    }
  }

  // ── Phase 2: Vote (30s) ───────────────────────────────────────────────────
  function startVotePhase() {
    broadcastPhase('vote', 30);
    let voteTimeLeft = 30;
    const voteTick = setInterval(() => {
      voteTimeLeft--;
      emitToRoom('timer_tick', { timeLeft: voteTimeLeft });
      if (voteTimeLeft <= 0) {
        clearInterval(voteTick);
        startSpyGuessPhase();
      }
    }, 1000);
    game.phaseTimer = voteTick;
  }

  function checkAllVotesIn() {
    const allIn = connected.every((p) => game.votes[p.id] !== undefined);
    if (allIn) {
      clearInterval(game.phaseTimer);
      startSpyGuessPhase();
    }
  }

  // ── Phase 3: Spy guess (20s) ──────────────────────────────────────────────
  function startSpyGuessPhase() {
    broadcastPhase('spy_guess', 20);

    // Send spy their hint to guess
    io.to(spy.socketId).emit('spy_guess_prompt', {
      gameId: game.id,
      timeLeft: 20,
    });

    let guessTimeLeft = 20;
    const guessTick = setInterval(() => {
      guessTimeLeft--;
      io.to(spy.socketId).emit('timer_tick', { timeLeft: guessTimeLeft });
      if (guessTimeLeft <= 0) {
        clearInterval(guessTick);
        resolveGame();
      }
    }, 1000);
    game.phaseTimer = guessTick;
  }

  // ── Resolve ───────────────────────────────────────────────────────────────
  function resolveGame() {
    clearInterval(game.phaseTimer);
    game.status = 'results';
    game.phase = 'results';

    // Tally votes
    const voteCounts: Record<string, number> = {};
    for (const targetId of Object.values(game.votes)) {
      voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
    }

    // Find max votes
    let maxVotes = 0;
    for (const count of Object.values(voteCounts)) {
      if (count > maxVotes) maxVotes = count;
    }

    const accused = Object.entries(voteCounts)
      .filter(([, count]) => count === maxVotes)
      .map(([pid]) => pid);

    const spyCaught = accused.includes(spy.id) && accused.length === 1;
    const isTie = accused.length > 1;

    // Normalize spy guess
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const spyGuessedCorrectly =
      game.spyGuess.length > 0 &&
      normalize(game.spyGuess) === normalize(game.currentWord);

    // Scoring
    if (spyCaught) {
      // Players who voted for spy get +150
      for (const [voterId, targetId] of Object.entries(game.votes)) {
        if (targetId === spy.id) {
          updateScore(game.id, voterId, 150);
        }
      }
      // If spy guessed word anyway → +200
      if (spyGuessedCorrectly) {
        updateScore(game.id, spy.id, 200);
      }
    } else if (!spyCaught && spyGuessedCorrectly) {
      // Spy uncaught and guessed → +300
      updateScore(game.id, spy.id, 300);
    } else if (isTie) {
      // Tie: players get +150 for each correctly accused
      for (const [voterId, targetId] of Object.entries(game.votes)) {
        if (targetId === spy.id) {
          updateScore(game.id, voterId, 150);
        }
      }
    }

    const result = endGame(game.id);

    emitToRoom('game_results', {
      gameId: game.id,
      spyId: spy.id,
      word: game.currentWord,
      votes: game.votes,
      voteCounts,
      spyGuess: game.spyGuess,
      spyGuessedCorrectly,
      spyCaught,
      isTie,
      scores: result?.finalScores ?? game.scores,
    });

    setTimeout(() => {
      emitToRoom('game_finished', {
        gameId: game.id,
        finalScores: result?.finalScores ?? game.scores,
        winner: result?.winner ?? null,
      });
    }, 8000);
  }

  return {
    gameId: game.id,

    handleHint(socket: Socket, data: { gameId: string; hint: string }) {
      if (data.gameId !== game.id) return;
      if (game.phase !== 'hints') return;
      const player = players.find((p) => p.socketId === socket.id);
      if (!player) return;
      if (game.hints[player.id] !== undefined) return; // already submitted

      const hint = sanitize(data.hint);
      game.hints[player.id] = hint;

      emitToRoom('hint_submitted', {
        gameId: game.id,
        playerId: player.id,
        hint,
      });

      checkAllHintsIn();
    },

    handleVote(socket: Socket, data: { gameId: string; targetId: string }) {
      if (data.gameId !== game.id) return;
      if (game.phase !== 'vote') return;
      const player = players.find((p) => p.socketId === socket.id);
      if (!player) return;
      if (game.votes[player.id] !== undefined) return;

      game.votes[player.id] = sanitize(data.targetId);
      checkAllVotesIn();
    },

    handleSpyGuess(socket: Socket, data: { gameId: string; guess: string }) {
      if (data.gameId !== game.id) return;
      if (game.phase !== 'spy_guess') return;
      const player = players.find((p) => p.socketId === socket.id);
      if (!player || player.id !== game.spyId) return;

      game.spyGuess = sanitize(data.guess);
      clearInterval(game.phaseTimer);
      resolveGame();
    },
  };
}
