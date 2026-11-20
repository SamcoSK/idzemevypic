import {
  LOBBY_CODE_LENGTH,
  LOBBY_CODE_CHARS,
  SYNC_CODE_LENGTH,
  SYNC_CODE_CHARS,
  FORBIDDEN_NICKNAMES,
  XP_PER_POINT,
  LEVEL_FORMULA,
} from './constants';

/**
 * Generate a random lobby code (5 uppercase alphanumeric chars, no ambiguous chars)
 */
export function generateLobbyCode(): string {
  let code = '';
  for (let i = 0; i < LOBBY_CODE_LENGTH; i++) {
    code += LOBBY_CODE_CHARS[Math.floor(Math.random() * LOBBY_CODE_CHARS.length)];
  }
  return code;
}

/**
 * Generate a sync code for reconnection (8 chars)
 */
export function generateSyncCode(): string {
  let code = '';
  for (let i = 0; i < SYNC_CODE_LENGTH; i++) {
    code += SYNC_CODE_CHARS[Math.floor(Math.random() * SYNC_CODE_CHARS.length)];
  }
  return code;
}

/**
 * Normalize text: lowercase, remove diacritics, trim whitespace
 * Used for comparing answers in Mesto-štát-rieka
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s]/g, '')     // keep only alphanumeric + spaces
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Slovak plural helper
 * @param n - number
 * @param singular - 1 (e.g. "hráč")
 * @param few - 2-4 (e.g. "hráči")
 * @param many - 5+ (e.g. "hráčov")
 */
export function pluralSk(n: number, singular: string, few: string, many: string): string {
  if (n === 1) return singular;
  if (n >= 2 && n <= 4) return few;
  return many;
}

/**
 * Sanitize nickname: remove HTML/script tags, limit length, trim
 */
export function sanitizeNickname(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')         // strip HTML tags
    .replace(/[<>&"']/g, '')         // strip XSS chars
    .replace(/\s+/g, ' ')            // normalize whitespace
    .trim()
    .substring(0, 20);               // max 20 chars
}

/**
 * Check if a nickname is forbidden
 */
export function isForbiddenNickname(nickname: string): boolean {
  const normalized = nickname.toLowerCase().trim();
  return FORBIDDEN_NICKNAMES.some(
    (forbidden) => normalized === forbidden || normalized.includes(forbidden)
  );
}

/**
 * Calculate score based on game mode and outcome
 */
export function calculateScore(params: {
  mode: string;
  isCorrect?: boolean;
  isImpostor?: boolean;
  impostorCaught?: boolean;
  impostorGuessedWord?: boolean;
  isUnique?: boolean;
  hasAnswer?: boolean;
}): number {
  const { mode, isCorrect, isImpostor, impostorCaught, impostorGuessedWord, isUnique, hasAnswer } = params;

  switch (mode) {
    case 'co-by-radej':
      return isCorrect ? 100 : 0;

    case 'podvodnik':
      if (isImpostor) {
        // Impostor gets 200 if they guess the word correctly
        return impostorGuessedWord ? 200 : 0;
      } else {
        // Regular players get 150 for catching the impostor
        return impostorCaught ? 150 : 0;
      }

    case 'kto-by-najskor':
      // 50 points for voting with the majority
      return isCorrect ? 50 : 0;

    case 'mesto-stat-rieka':
      if (!hasAnswer) return 0;
      return isUnique ? 100 : 50;

    default:
      return 0;
  }
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate XP gain from score
 */
export function calculateXP(score: number): number {
  return score * XP_PER_POINT;
}

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  return LEVEL_FORMULA(xp);
}

/**
 * Format a lobby code for display (always uppercase)
 */
export function formatLobbyCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Validate a lobby code format
 */
export function isValidLobbyCode(code: string): boolean {
  return /^[A-Z2-9]{5}$/.test(code.toUpperCase());
}

/**
 * Get display name for content mode
 */
export function getContentModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    mierne: '😇 Mierne',
    mix: '🌶️ Mix',
    odvazne: '🔥 Odvážne',
  };
  return labels[mode] || mode;
}

/**
 * Delay helper
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
