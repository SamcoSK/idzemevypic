import type { GameMode, ContentMode } from '@/types';

// Player limits
export const MAX_PLAYERS = 12;
export const MIN_PLAYERS: Record<GameMode, number> = {
  'co-by-radej': 2,
  'podvodnik': 3,
  'kto-by-najskor': 3,
  'mesto-stat-rieka': 2,
};

// Lobby settings
export const LOBBY_CODE_LENGTH = 5;
export const LOBBY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Game timing (ms)
export const VOTE_TIMEOUT_MS = 20000;
export const RESULTS_DISPLAY_MS = 5000;
export const ROUND_START_COUNTDOWN_MS = 3000;

// Round options
export const DEFAULT_ROUNDS = 10;
export const ROUND_OPTIONS = [5, 10, 15];

// Content modes
export const CONTENT_MODES: Array<{ value: ContentMode; label: string; description: string }> = [
  {
    value: 'mierne',
    label: '😇 Mierne',
    description: 'Vhodné pre všetkých, bez sexuálnych otázok',
  },
  {
    value: 'mix',
    label: '🌶️ Mix',
    description: 'Kombinácia miernych a odvážnych otázok',
  },
  {
    value: 'odvazne',
    label: '🔥 Odvážne',
    description: 'Pre dospelých 18+, pikantné otázky',
  },
];

// Game modes
export const GAME_MODES: Array<{ value: GameMode; label: string; description: string; icon: string; minPlayers: number }> = [
  {
    value: 'co-by-radej',
    label: 'Čo by si radšej?',
    description: 'Vyber medzi dvoma možnosťami. Uhádni, čo zvolí väčšina!',
    icon: '🤔',
    minPlayers: 2,
  },
  {
    value: 'podvodnik',
    label: 'Podvodník',
    description: 'Jeden hráč je podvodník. Odhali ho pred ostatnými!',
    icon: '🕵️',
    minPlayers: 3,
  },
  {
    value: 'kto-by-najskor',
    label: 'Kto by najskôr?',
    description: 'Hlasuj, kto by zo skupiny najskôr niečo urobil.',
    icon: '👆',
    minPlayers: 3,
  },
  {
    value: 'mesto-stat-rieka',
    label: 'Mesto-štát-rieka',
    description: 'Klasická hra! Píšte slová na zadané písmeno.',
    icon: '🏙️',
    minPlayers: 2,
  },
];

// Scoring
export const SCORING = {
  'co-by-radej': {
    correct: 100,
  },
  'podvodnik': {
    detectorCorrect: 150,
    impostorWin: 200,
    impostorCaught: 0,
  },
  'kto-by-najskor': {
    majorityVote: 50,
  },
  'mesto-stat-rieka': {
    unique: 100,
    shared: 50,
    empty: 0,
  },
};

// XP / Level formula: level = floor(sqrt(xp / 100))
export const XP_PER_POINT = 1;
export const LEVEL_FORMULA = (xp: number) => Math.floor(Math.sqrt(xp / 100));

// Emoji list (30+)
export const DEFAULT_EMOJI = '🍺';
export const EMOJI_LIST = [
  '🦁', '🐯', '🦊', '🐺', '🦝',
  '🐸', '🐧', '🦄', '🐉', '🦋',
  '🐙', '🦑', '🦈', '🐊', '🦖',
  '🌵', '🌴', '🍄', '🌈', '⚡',
  '🍕', '🍺', '🍓', '🌮', '🧁',
  '🎸', '🎯', '🎲', '🃏', '🎭',
  '🚀', '👻', '💀', '🤖', '👾',
  '🌙', '⭐', '🔥', '💎', '🎉',
];

// Forbidden nicknames (blacklist)
export const FORBIDDEN_NICKNAMES = [
  'admin', 'server', 'bot', 'system', 'null', 'undefined',
  'host', 'moderator', 'mod', 'operator', 'owner',
  'fuck', 'shit', 'kurva', 'picsa', 'hajzel', 'debil',
  'idiot', 'blbec', 'cretin', 'nigger', 'faggot',
];

// Sync code for reconnection
export const SYNC_CODE_LENGTH = 8;
export const SYNC_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Rate limiting
export const RATE_LIMIT_MAX_EVENTS = 10;
export const RATE_LIMIT_WINDOW_MS = 5000;
