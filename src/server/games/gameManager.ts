import { v4 as uuidv4 } from 'uuid';
import type { GameMode, ContentMode, GameState, Player } from '@/types';

export interface ExtendedGameState extends GameState {
  lobbyCode: string;
  mode: GameMode;
  contentMode: ContentMode;
  players: Player[];
  usedQuestionIds: Array<string | number>;
  roundScores: Record<string, number>; // scores for current round
  titles?: Record<string, string>; // for kto-by-najskor
  startedAt: number;
}

export interface GameResult {
  gameId: string;
  mode: GameMode;
  finalScores: Record<string, number>;
  winner: string | null;
  rounds: number;
}

// In-memory store
const games = new Map<string, ExtendedGameState>();

/**
 * Create and store a new game state.
 */
export function startGame(
  lobbyCode: string,
  gameMode: GameMode,
  players: Player[],
  contentMode: ContentMode,
  totalRounds: number
): ExtendedGameState {
  const id = uuidv4();
  const scores: Record<string, number> = {};
  players.forEach((p) => { scores[p.id] = 0; });

  const state: ExtendedGameState = {
    id,
    lobbyCode,
    mode: gameMode,
    contentMode,
    players,
    round: 0,
    totalRounds,
    status: 'waiting',
    scores,
    roundScores: {},
    usedQuestionIds: [],
    startedAt: Date.now(),
    timeLeft: 0,
    titles: {},
  };

  games.set(id, state);
  return state;
}

export function getGame(gameId: string): ExtendedGameState | undefined {
  return games.get(gameId);
}

export function updateScore(gameId: string, playerId: string, points: number): void {
  const game = games.get(gameId);
  if (!game) return;
  game.scores[playerId] = (game.scores[playerId] ?? 0) + points;
  game.roundScores[playerId] = (game.roundScores[playerId] ?? 0) + points;
}

export function nextRound(gameId: string): void {
  const game = games.get(gameId);
  if (!game) return;
  game.round += 1;
  game.roundScores = {};
  // reset status
  game.status = 'playing';
}

export function endGame(gameId: string): GameResult | null {
  const game = games.get(gameId);
  if (!game) return null;

  game.status = 'finished';

  let winner: string | null = null;
  let topScore = -1;
  for (const [pid, score] of Object.entries(game.scores)) {
    if (score > topScore) {
      topScore = score;
      winner = pid;
    }
  }

  const result: GameResult = {
    gameId,
    mode: game.mode,
    finalScores: { ...game.scores },
    winner,
    rounds: game.round,
  };

  // Keep in map a bit for final results fetching; coordinator can clean up
  return result;
}

export function deleteGame(gameId: string): void {
  games.delete(gameId);
}

export function getAllGames(): Map<string, ExtendedGameState> {
  return games;
}
