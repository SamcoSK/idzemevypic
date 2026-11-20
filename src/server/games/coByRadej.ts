import type { Server, Socket } from 'socket.io';
import type { Player, ContentMode } from '@/types';
import { startGame, getGame, updateScore, nextRound, endGame, type ExtendedGameState } from './gameManager';
import { pickQuestion } from './questionPicker';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoByRadejGameState extends ExtendedGameState {
  currentVotes: Record<string, { choice: 'A' | 'B'; prediction: 'A' | 'B' }>;
  roundTimer?: ReturnType<typeof setTimeout>;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function sanitize(str: string): string {
  return String(str).replace(/[<>&"'`]/g, '').slice(0, 50);
}

// ─── Main game handler ────────────────────────────────────────────────────────

export function runCoByRadej(
  io: Server,
  lobbyCode: string,
  players: Player[],
  contentMode: ContentMode,
  totalRounds: number
) {
  const game = startGame(lobbyCode, 'co-by-radej', players, contentMode, totalRounds) as CoByRadejGameState;
  game.currentVotes = {};

  const room = lobbyCode;
  const roomAlt = `lobby:${lobbyCode}`;

  function emitToRoom(event: string, data: any) {
    io.to(room).emit(event, data);
    io.to(roomAlt).emit(event, data);
  }

  async function startRound() {
    if (game.round >= game.totalRounds) {
      return finishGame();
    }

    nextRound(game.id);
    game.currentVotes = {};

    const question = pickQuestion('co-by-radej', game.usedQuestionIds, game.contentMode);
    if (!question) return finishGame();

    game.currentQuestion = question;
    game.usedQuestionIds.push(question.id);
    game.status = 'voting';
    game.timeLeft = 20;

    emitToRoom('game_question', {
      gameId: game.id,
      question,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      timeLeft: 20,
    });

    // Countdown
    let timeLeft = 20;
    const tick = setInterval(() => {
      timeLeft--;
      emitToRoom('timer_tick', { timeLeft });
      if (timeLeft <= 0) {
        clearInterval(tick);
        closeVoting();
      }
    }, 1000);

    game.roundTimer = tick as unknown as ReturnType<typeof setTimeout>;
  }

  function closeVoting() {
    if (game.status !== 'voting') return;
    game.status = 'results';

    const question = game.currentQuestion!;
    const votes = Object.values(game.currentVotes);

    let votesA = 0;
    let votesB = 0;
    votes.forEach((v) => {
      if (v.choice === 'A') votesA++;
      else votesB++;
    });

    const total = votesA + votesB;
    const percentA = total > 0 ? Math.round((votesA / total) * 100) : 50;
    const percentB = 100 - percentA;

    // Majority
    let majority: 'A' | 'B' | 'TIE' = 'TIE';
    if (votesA > votesB) majority = 'A';
    else if (votesB > votesA) majority = 'B';

    const roundScores: Record<string, number> = {};
    for (const [playerId, vote] of Object.entries(game.currentVotes)) {
      let pts = 0;
      if (majority === 'TIE') {
        // On tie, everyone who predicted either gets +100
        pts = 100;
      } else if (vote.prediction === majority) {
        pts = 100;
      }
      if (pts > 0) {
        updateScore(game.id, playerId, pts);
        roundScores[playerId] = pts;
      }
    }

    emitToRoom('game_results', {
      gameId: game.id,
      question,
      votesA,
      votesB,
      percentA,
      percentB,
      majority,
      roundScores,
      totalScores: { ...game.scores },
      roundNum: game.round,
      totalRounds: game.totalRounds,
    });

    // Next round after 5s
    setTimeout(() => {
      if (game.round >= game.totalRounds) {
        finishGame();
      } else {
        startRound();
      }
    }, 5000);
  }

  function finishGame() {
    const result = endGame(game.id);
    emitToRoom('game_finished', {
      gameId: game.id,
      finalScores: result?.finalScores ?? game.scores,
      winner: result?.winner ?? null,
    });
  }

  // Start first round
  startRound();

  // Return handler for incoming cast_vote events
  return {
    gameId: game.id,
    handleVote(socket: Socket, data: { gameId: string; choice: 'A' | 'B'; prediction: 'A' | 'B' }) {
      if (data.gameId !== game.id) return;
      if (game.status !== 'voting') return;

      const player = players.find((p) => p.socketId === socket.id);
      if (!player) return;
      if (game.currentVotes[player.id]) return; // already voted

      game.currentVotes[player.id] = {
        choice: sanitize(data.choice) as 'A' | 'B',
        prediction: sanitize(data.prediction) as 'A' | 'B',
      };

      // Check if all connected players voted
      const connectedPlayers = players.filter((p) => p.isConnected);
      if (Object.keys(game.currentVotes).length >= connectedPlayers.length) {
        if (game.roundTimer) clearInterval(game.roundTimer as unknown as ReturnType<typeof setInterval>);
        closeVoting();
      }
    },
  };
}
