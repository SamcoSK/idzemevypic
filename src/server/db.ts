import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/game.db';
const resolvedPath = path.resolve(DB_PATH);

// Ensure directory exists
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Create / open the database
const db = new Database(resolvedPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===== Initialize tables =====
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    emoji TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    sync_code TEXT UNIQUE,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS lobbies (
    code TEXT PRIMARY KEY,
    host_id TEXT NOT NULL,
    content_mode TEXT NOT NULL DEFAULT 'mierne',
    status TEXT NOT NULL DEFAULT 'waiting',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS lobby_players (
    lobby_code TEXT NOT NULL,
    player_id TEXT NOT NULL,
    joined_at INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (lobby_code, player_id),
    FOREIGN KEY (lobby_code) REFERENCES lobbies(code) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    lobby_code TEXT NOT NULL,
    mode TEXT NOT NULL,
    rounds INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'playing',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (lobby_code) REFERENCES lobbies(code) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    round_num INTEGER NOT NULL,
    question_id TEXT,
    question_text TEXT NOT NULL,
    started_at INTEGER DEFAULT (strftime('%s', 'now')),
    ended_at INTEGER,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    target_id TEXT,
    answer TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    lobby_code TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    player_id TEXT PRIMARY KEY,
    wins INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby ON lobby_players(lobby_code);
  CREATE INDEX IF NOT EXISTS idx_games_lobby ON games(lobby_code);
  CREATE INDEX IF NOT EXISTS idx_rounds_game ON rounds(game_id);
  CREATE INDEX IF NOT EXISTS idx_votes_round ON votes(round_id);
`);

export { db };

export function getDb() {
  return db;
}

// ===== Helper Functions =====

export function getLobby(code: string) {
  return db.prepare('SELECT * FROM lobbies WHERE code = ?').get(code) as any;
}

export function createLobby(data: {
  code: string;
  hostId: string;
  contentMode: string;
}) {
  db.prepare(`
    INSERT INTO lobbies (code, host_id, content_mode, status)
    VALUES (?, ?, ?, 'waiting')
  `).run(data.code, data.hostId, data.contentMode);
}

export function updateLobbyStatus(code: string, status: string) {
  db.prepare('UPDATE lobbies SET status = ? WHERE code = ?').run(status, code);
}

export function getPlayer(id: string) {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id) as any;
}

export function getPlayerBySyncCode(syncCode: string) {
  return db.prepare('SELECT * FROM players WHERE sync_code = ?').get(syncCode) as any;
}

export function createPlayer(data: {
  id: string;
  nickname: string;
  emoji: string;
  syncCode: string;
}) {
  db.prepare(`
    INSERT INTO players (id, nickname, emoji, sync_code)
    VALUES (?, ?, ?, ?)
  `).run(data.id, data.nickname, data.emoji, data.syncCode);
}

export function updatePlayerXP(playerId: string, xpGain: number) {
  db.prepare(`
    UPDATE players
    SET xp = xp + ?,
        level = CAST(FLOOR(SQRT((xp + ?) / 100.0)) AS INTEGER)
    WHERE id = ?
  `).run(xpGain, xpGain, playerId);
}

export function addPlayerToLobby(lobbyCode: string, playerId: string) {
  db.prepare(`
    INSERT OR IGNORE INTO lobby_players (lobby_code, player_id)
    VALUES (?, ?)
  `).run(lobbyCode, playerId);
}

export function removePlayerFromLobby(lobbyCode: string, playerId: string) {
  db.prepare('DELETE FROM lobby_players WHERE lobby_code = ? AND player_id = ?')
    .run(lobbyCode, playerId);
}

export function getLobbyPlayers(lobbyCode: string) {
  return db.prepare(`
    SELECT p.* FROM players p
    JOIN lobby_players lp ON p.id = lp.player_id
    WHERE lp.lobby_code = ?
    ORDER BY lp.joined_at ASC
  `).all(lobbyCode) as any[];
}

export function createGame(data: {
  id: string;
  lobbyCode: string;
  mode: string;
  rounds: number;
}) {
  db.prepare(`
    INSERT INTO games (id, lobby_code, mode, rounds, status)
    VALUES (?, ?, ?, ?, 'playing')
  `).run(data.id, data.lobbyCode, data.mode, data.rounds);
}

export function createRound(data: {
  id: string;
  gameId: string;
  roundNum: number;
  questionId?: string;
  questionText: string;
}) {
  db.prepare(`
    INSERT INTO rounds (id, game_id, round_num, question_id, question_text)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.id, data.gameId, data.roundNum, data.questionId || null, data.questionText);
}

export function endRound(roundId: string) {
  db.prepare('UPDATE rounds SET ended_at = strftime(\'%s\', \'now\') WHERE id = ?').run(roundId);
}

export function saveVote(data: {
  id: string;
  roundId: string;
  playerId: string;
  targetId?: string;
  answer?: string;
}) {
  db.prepare(`
    INSERT INTO votes (id, round_id, player_id, target_id, answer)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.id, data.roundId, data.playerId, data.targetId || null, data.answer || null);
}

export function saveFeedback(data: { id: string; text: string; lobbyCode?: string }) {
  db.prepare(`
    INSERT INTO feedback (id, text, lobby_code)
    VALUES (?, ?, ?)
  `).run(data.id, data.text, data.lobbyCode || null);
}

export function updateLeaderboard(data: {
  playerId: string;
  won: boolean;
  score: number;
}) {
  db.prepare(`
    INSERT INTO leaderboard (player_id, wins, games_played, total_score, updated_at)
    VALUES (?, ?, 1, ?, strftime('%s', 'now'))
    ON CONFLICT(player_id) DO UPDATE SET
      wins = wins + ?,
      games_played = games_played + 1,
      total_score = total_score + ?,
      updated_at = strftime('%s', 'now')
  `).run(
    data.playerId,
    data.won ? 1 : 0,
    data.score,
    data.won ? 1 : 0,
    data.score
  );
}

export function getLeaderboard(limit = 10) {
  return db.prepare(`
    SELECT l.*, p.nickname, p.emoji, p.level
    FROM leaderboard l
    JOIN players p ON l.player_id = p.id
    ORDER BY l.total_score DESC
    LIMIT ?
  `).all(limit) as any[];
}
