import type { Server, Socket } from 'socket.io';
import type { Player, ContentMode } from '@/types';
import { startGame, getGame, updateScore, nextRound, endGame, type ExtendedGameState } from './gameManager';
import { pickQuestion } from './questionPicker';

export interface KtoByNajskorState extends ExtendedGameState {
  currentVotes: Record<string, string>; // voterId -> targetPlayerId
  roundTimer?: ReturnType<typeof setInterval>;
}

export function runKtoByNajskor(
  io: Server,
  lobbyCode: string,
  players: Player[],
  contentMode: ContentMode,
  totalRounds: number = 10
) {
  const game = startGame(lobbyCode, 'kto-by-najskor', players, contentMode, totalRounds) as KtoByNajskorState;
  game.currentVotes = {};

  const room = lobbyCode;

  async function startRound() {
    if (game.round >= game.totalRounds) {
      return finishGame();
    }

    nextRound(game.id);
    game.currentVotes = {};

    const question = pickQuestion('kto-by-najskor', game.usedQuestionIds, game.contentMode);
    if (!question) return finishGame();

    game.currentQuestion = question;
    game.usedQuestionIds.push(question.id);
    game.status = 'voting';
    game.timeLeft = 20;

    const connectedPlayers = game.players.filter((p) => p.isConnected);

    io.to(room).emit('kto_question', {
      gameId: game.id,
      question,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      timeLeft: 20,
      candidates: connectedPlayers.map((p) => ({ id: p.id, nickname: p.nickname, emoji: p.emoji })),
    });
    // Also emit generic game_question for universal components
    io.to(room).emit('game_question', {
      gameId: game.id,
      question,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      timeLeft: 20,
      candidates: connectedPlayers.map((p) => ({ id: p.id, nickname: p.nickname, emoji: p.emoji })),
    });

    let timeLeft = 20;
    const tick = setInterval(() => {
      timeLeft--;
      io.to(room).emit('timer_tick', { timeLeft });
      if (timeLeft <= 0) {
        clearInterval(tick);
        closeVoting();
      }
    }, 1000);

    game.roundTimer = tick;
  }

  function closeVoting() {
    if (game.status !== 'voting') return;
    game.status = 'results';

    const connectedPlayers = game.players.filter((p) => p.isConnected);
    // Count votes for each candidate
    const voteCounts: Record<string, number> = {};
    connectedPlayers.forEach((p) => { voteCounts[p.id] = 0; });

    Object.values(game.currentVotes).forEach((targetId) => {
      if (voteCounts[targetId] !== undefined) {
        voteCounts[targetId]++;
      }
    });

    // Find highest vote count
    let maxVotes = 0;
    for (const count of Object.values(voteCounts)) {
      if (count > maxVotes) maxVotes = count;
    }

    // Winners of the title (can be tie)
    const titleHolders = maxVotes > 0 
      ? Object.keys(voteCounts).filter((pid) => voteCounts[pid] === maxVotes)
      : [];

    // Award +50 points to players who voted for any of the majority candidates
    const roundScores: Record<string, number> = {};
    connectedPlayers.forEach((p) => { roundScores[p.id] = 0; });

    for (const [voterId, targetId] of Object.entries(game.currentVotes)) {
      if (titleHolders.includes(targetId)) {
        updateScore(game.id, voterId, 50);
        roundScores[voterId] = 50;
      }
    }

    // Build ranking
    const rankings = connectedPlayers.map((p) => ({
      player: { id: p.id, nickname: p.nickname, emoji: p.emoji },
      voteCount: voteCounts[p.id] || 0,
      isWinner: titleHolders.includes(p.id),
      title: titleHolders.includes(p.id) ? 'Najväčší kandidát' : undefined,
    })).sort((a, b) => b.voteCount - a.voteCount);

    const winnerNames = titleHolders.map((tid) => {
      const pl = connectedPlayers.find((p) => p.id === tid);
      return pl ? `${pl.emoji} ${pl.nickname}` : '';
    }).filter(Boolean).join(' & ');

    io.to(room).emit('kto_results', {
      gameId: game.id,
      question: game.currentQuestion,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      rankings,
      titleHolders,
      winnerTitle: winnerNames ? `👑 Titul kola: ${winnerNames}` : 'Nikto nezískal väčšinu',
      roundScores,
      totalScores: game.scores,
    });
    io.to(room).emit('game_results', {
      gameId: game.id,
      question: game.currentQuestion,
      roundNum: game.round,
      totalRounds: game.totalRounds,
      rankings,
      titleHolders,
      winnerTitle: winnerNames ? `👑 Titul kola: ${winnerNames}` : 'Nikto nezískal väčšinu',
      roundScores,
      totalScores: game.scores,
    });

    // Next round after 7 seconds
    setTimeout(() => {
      startRound();
    }, 7000);
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

  // Socket listener for voting
  function onCastVote(socket: Socket, data: { gameId: string; targetId: string }) {
    if (data.gameId !== game.id || game.status !== 'voting') return;

    const player = game.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    // Rule: Cannot vote for yourself
    if (data.targetId === player.id) {
      socket.emit('error', { message: 'Nemôžeš hlasovať za seba!', code: 'CANNOT_VOTE_SELF' });
      return;
    }

    // Verify target exists in game
    if (!game.players.some((p) => p.id === data.targetId)) {
      return;
    }

    game.currentVotes[player.id] = data.targetId;
    socket.emit('vote_confirmed', { targetId: data.targetId });

    // Check if all connected players voted
    const connected = game.players.filter((p) => p.isConnected);
    if (Object.keys(game.currentVotes).length >= connected.length) {
      if (game.roundTimer) clearInterval(game.roundTimer);
      closeVoting();
    }
  }

  // Start immediately
  startRound();

  return {
    gameId: game.id,
    onCastVote,
  };
}
