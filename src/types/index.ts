export type GameMode = 'co-by-radej' | 'podvodnik' | 'kto-by-najskor' | 'mesto-stat-rieka';
export type ContentMode = 'mierne' | 'mix' | 'odvazne';
export type Sharpness = 'mierne' | 'odvazne';

export interface Player {
  id: string;
  nickname: string;
  emoji: string;
  score: number;
  xp: number;
  level: number;
  isHost: boolean;
  isConnected: boolean;
  socketId: string;
  syncCode?: string;
}

export interface Lobby {
  code: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  contentMode: ContentMode;
  gameMode?: GameMode;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

export interface GameState {
  id: string;
  lobbyCode: string;
  mode: GameMode;
  round: number;
  totalRounds: number;
  status: 'waiting' | 'playing' | 'voting' | 'results' | 'finished';
  currentQuestion?: Question;
  scores: Record<string, number>;
  timeLeft: number;
}

export interface Question {
  id: string | number;
  text: string;
  kategoria?: string;
  ostrost: Sharpness;
}

export interface Vote {
  playerId: string;
  targetId?: string;
  answer?: string;
  timestamp: number;
}

export interface RoundResult {
  question: Question;
  votes: Vote[];
  scores: Record<string, number>;
  winner?: string;
}

export interface LobbyState {
  lobby: Lobby | null;
  player: Player | null;
  isLoading: boolean;
  error: string | null;
}

export interface SocketEvents {
  // Client → Server
  create_lobby: (data: { nickname: string; emoji: string; contentMode: ContentMode }) => void;
  join_lobby: (data: { code: string; nickname: string; emoji: string }) => void;
  leave_lobby: () => void;
  kick_player: (data: { targetId: string }) => void;
  select_game: (data: { gameMode: GameMode }) => void;
  start_game: (data: { totalRounds: number }) => void;
  reconnect_player: (data: { lobbyCode: string; syncCode: string }) => void;
  submit_vote: (data: { roundId: string; targetId?: string; answer?: string }) => void;
  // Server → Client
  lobby_created: (data: { lobby: Lobby; player: Player }) => void;
  lobby_updated: (data: { lobby: Lobby }) => void;
  player_joined: (data: { player: Player; lobby: Lobby }) => void;
  player_left: (data: { playerId: string; lobby: Lobby }) => void;
  player_kicked: (data: { playerId: string }) => void;
  host_transferred: (data: { newHostId: string }) => void;
  game_selected: (data: { gameMode: GameMode }) => void;
  game_started: (data: { gameId: string; gameMode: GameMode }) => void;
  error: (data: { message: string; code: string }) => void;
}
