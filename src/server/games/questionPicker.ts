import type { GameMode, ContentMode, Question } from '@/types';
import path from 'path';
import fs from 'fs';

// Cache loaded question files
const questionCache: Record<string, Question[]> = {};

function loadQuestions(mode: GameMode): Question[] {
  if (questionCache[mode]) return questionCache[mode];

  const fileMap: Partial<Record<GameMode, string>> = {
    'co-by-radej': 'co-by-si-radej.json',
    'podvodnik': 'podvodnik.json',
    'kto-by-najskor': 'kto-by-najskor.json',
  };

  const fileName = fileMap[mode];
  if (!fileName) return [];

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', fileName);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    // Handle both array and {questions:[]} formats
    const questions: Question[] = Array.isArray(data) ? data : (data.questions ?? data.slova ?? []);
    questionCache[mode] = questions;
    return questions;
  } catch (err) {
    console.error(`[questionPicker] Failed to load ${fileName}:`, err);
    return [];
  }
}

/**
 * Pick a random question for the given mode, excluding already used IDs.
 * Filters by contentMode:
 *   - 'mierne'  → only ostrost='mierne'
 *   - 'odvazne' → only ostrost='odvazne'
 *   - 'mix'     → all
 */
export function pickQuestion(
  mode: GameMode,
  usedIds: Array<string | number>,
  contentMode: ContentMode
): Question | null {
  const all = loadQuestions(mode);

  let pool = all.filter((q) => !usedIds.includes(q.id));

  if (contentMode !== 'mix') {
    const filtered = pool.filter((q) => q.ostrost === contentMode);
    // Fall back to full pool (excluding used) if no matches
    if (filtered.length > 0) pool = filtered;
  }

  if (pool.length === 0) {
    // Reset and pick any
    const resetPool = contentMode === 'mix' ? all : all.filter((q) => q.ostrost === contentMode);
    if (resetPool.length === 0) return null;
    return resetPool[Math.floor(Math.random() * resetPool.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick a spy word from podvodnik.json
 */
export interface SpyWord {
  id: number;
  slovo: string;
  kategoria: string;
  ostrost: 'mierne' | 'odvazne';
  napovedy?: string[];
}

const spyWordCache: SpyWord[] = [];

export function pickSpyWord(usedIds: number[], contentMode: ContentMode): SpyWord | null {
  if (spyWordCache.length === 0) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'podvodnik.json');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      const words: SpyWord[] = Array.isArray(data) ? data : (data.slova ?? data.words ?? []);
      spyWordCache.push(...words);
    } catch (err) {
      console.error('[questionPicker] Failed to load podvodnik.json:', err);
      return null;
    }
  }

  let pool = spyWordCache.filter((w) => !usedIds.includes(w.id));
  if (contentMode !== 'mix') {
    const filtered = pool.filter((w) => w.ostrost === contentMode);
    if (filtered.length > 0) pool = filtered;
  }

  if (pool.length === 0) {
    // Reset
    pool = contentMode === 'mix' ? spyWordCache : spyWordCache.filter((w) => w.ostrost === contentMode);
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
