import type { Server, Socket } from 'socket.io';
import type { Player, ContentMode } from '@/types';
import { startGame, getGame, updateScore, nextRound, endGame, type ExtendedGameState } from './gameManager';
import { normalizeText } from '@/lib/gameUtils';
import fs from 'fs';
import path from 'path';

export interface CategoryDef {
  id: string;
  nazov: string;
  priklad: string;
}

export interface MestoStatRiekaState extends ExtendedGameState {
  letter: string;
  categories: CategoryDef[];
  playerAnswers: Record<string, Record<string, string>>; // playerId -> categoryId -> answer
  roundTimer?: ReturnType<typeof setInterval>;
}

const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'mesto', nazov: 'Mesto', priklad: 'Bratislava' },
  { id: 'stat', nazov: 'Štát', priklad: 'Slovensko' },
  { id: 'zviera', nazov: 'Zviera', priklad: 'Medveď' },
  { id: 'meno', nazov: 'Meno', priklad: 'Milan' },
  { id: 'vec', nazov: 'Vec', priklad: 'Mobil' },
  { id: 'jedlo', nazov: 'Jedlo / Nápoj', priklad: 'Kofola' },
];

const ALLOWED_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Z'];

export function runMestoStatRieka(
  io: Server,
  lobbyCode: string,
  players: Player[],
  contentMode: ContentMode,
  totalRounds: number = 3
) {
  const game = startGame(lobbyCode, 'mesto-stat-rieka', players, contentMode, totalRounds) as MestoStatRiekaState;
  game.categories = DEFAULT_CATEGORIES;
  game.playerAnswers = {};

  const room = lobbyCode;
  const usedLetters: string[] = [];

  function pickLetter(): string {
    const available = ALLOWED_LETTERS.filter((l) => !usedLetters.includes(l));
    const pool = available.length > 0 ? available : ALLOWED_LETTERS;
    const letter = pool[Math.floor(Math.random() * pool.length)];
    usedLetters.push(letter);
    return letter;
  }

  async function startRound() {
    if (game.round >= game.totalRounds) {
      return finishGame();
    }

    nextRound(game.id);
    game.playerAnswers = {};
    game.letter = pickLetter();
    game.status = 'playing';
    game.timeLeft = 60;

    io.to(room).emit('mesto_round', {
      gameId: game.id,
      letter: game.letter,
      categories: game.categories,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      timeLeft: 60,
    });
    // Also emit generic game_question for universal components
    io.to(room).emit('game_question', {
      gameId: game.id,
      letter: game.letter,
      categories: game.categories,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      timeLeft: 60,
    });

    let timeLeft = 60;
    const tick = setInterval(() => {
      timeLeft--;
      io.to(room).emit('timer_tick', { timeLeft });
      if (timeLeft <= 0) {
        clearInterval(tick);
        evaluateRound();
      }
    }, 1000);

    game.roundTimer = tick;
  }

  function evaluateRound() {
    if (game.status !== 'playing') return;
    game.status = 'results';

    const connectedPlayers = game.players.filter((p) => p.isConnected);
    const roundScores: Record<string, number> = {};
    const categoryDetails: Record<string, Record<string, { answer: string; score: number; status: 'unique' | 'shared' | 'invalid' }>> = {};

    connectedPlayers.forEach((p) => {
      roundScores[p.id] = 0;
      categoryDetails[p.id] = {};
    });

    // Evaluate category by category
    for (const cat of game.categories) {
      const answersMap: Record<string, string[]> = {}; // normalizedAnswer -> [playerIds]

      for (const p of connectedPlayers) {
        const rawAns = game.playerAnswers[p.id]?.[cat.id]?.trim() || '';
        const norm = normalizeText(rawAns);
        const targetLetterNorm = normalizeText(game.letter);

        // Valid if starts with correct letter and length >= 2
        if (norm.length >= 2 && norm.startsWith(targetLetterNorm)) {
          if (!answersMap[norm]) answersMap[norm] = [];
          answersMap[norm].push(p.id);
        }
      }

      for (const p of connectedPlayers) {
        const rawAns = game.playerAnswers[p.id]?.[cat.id]?.trim() || '';
        const norm = normalizeText(rawAns);
        const targetLetterNorm = normalizeText(game.letter);

        if (norm.length >= 2 && norm.startsWith(targetLetterNorm)) {
          const playersWithSame = answersMap[norm] || [];
          if (playersWithSame.length === 1) {
            // Unique answer: 100 points
            roundScores[p.id] += 100;
            categoryDetails[p.id][cat.id] = { answer: rawAns, score: 100, status: 'unique' };
          } else {
            // Shared answer: 50 points
            roundScores[p.id] += 50;
            categoryDetails[p.id][cat.id] = { answer: rawAns, score: 50, status: 'shared' };
          }
        } else {
          // Empty or wrong starting letter: 0 points
          categoryDetails[p.id][cat.id] = { answer: rawAns, score: 0, status: 'invalid' };
        }
      }
    }

    // Apply scores
    for (const p of connectedPlayers) {
      updateScore(game.id, p.id, roundScores[p.id]);
    }

    io.to(room).emit('mesto_results', {
      gameId: game.id,
      letter: game.letter,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      roundScores,
      totalScores: game.scores,
      categoryDetails,
      playerAnswers: game.playerAnswers,
    });
    io.to(room).emit('game_results', {
      gameId: game.id,
      letter: game.letter,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      roundScores,
      totalScores: game.scores,
      categoryDetails,
      playerAnswers: game.playerAnswers,
    });

    // Next round after 8 seconds
    setTimeout(() => {
      startRound();
    }, 8000);
  }

  function finishGame() {
    const result = endGame(game.id);
    if (!result) return;

    io.to(room).emit('game_finished', {
      gameId: game.id,
      finalScores: result.finalScores,
      winner: result.winner,
    });
  }

  // Socket listener for answer submission
  function onSubmitAnswers(socket: Socket, data: { gameId: string; answers: Record<string, string>; finishedEarly?: boolean }) {
    if (data.gameId !== game.id || game.status !== 'playing') return;

    const player = game.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    game.playerAnswers[player.id] = data.answers || {};
    socket.emit('answers_received', { ok: true });

    // If player declared finished early (STOP)
    if (data.finishedEarly) {
      io.to(room).emit('player_stopped', {
        playerId: player.id,
        nickname: player.nickname,
        emoji: player.emoji,
      });

      // Give others 10 seconds to finish
      if (game.roundTimer) {
        clearInterval(game.roundTimer);
      }
      let stopCountdown = 10;
      io.to(room).emit('timer_tick', { timeLeft: stopCountdown });
      game.roundTimer = setInterval(() => {
        stopCountdown--;
        io.to(room).emit('timer_tick', { timeLeft: stopCountdown });
        if (stopCountdown <= 0) {
          if (game.roundTimer) clearInterval(game.roundTimer);
          evaluateRound();
        }
      }, 1000);
    }
  }

  startRound();

  return {
    gameId: game.id,
    onSubmitAnswers,
  };
}
