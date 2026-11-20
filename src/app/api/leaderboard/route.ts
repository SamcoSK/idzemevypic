import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  const dbPath = path.join(process.cwd(), 'data', 'game.db');
  const db = new Database(dbPath);

  // Ensure leaderboard table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🎮',
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);

  return db;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    const db = getDb();

    let whereClause = '';
    const now = Math.floor(Date.now() / 1000);

    if (period === 'week') {
      const weekAgo = now - 7 * 24 * 60 * 60;
      whereClause = `WHERE updated_at >= ${weekAgo}`;
    } else if (period === 'today') {
      const startOfDay = now - (now % 86400);
      whereClause = `WHERE updated_at >= ${startOfDay}`;
    }

    const rows = db
      .prepare(
        `SELECT
          id,
          nickname,
          emoji,
          xp,
          level,
          wins,
          games_played,
          CASE WHEN games_played > 0 THEN ROUND(wins * 100.0 / games_played, 1) ELSE 0 END AS win_rate
        FROM leaderboard
        ${whereClause}
        ORDER BY xp DESC
        LIMIT 10`
      )
      .all();

    db.close();

    return NextResponse.json({ players: rows, period });
  } catch (error) {
    console.error('[Leaderboard API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, emoji, xpGain, win, gameId } = body;

    if (!nickname || typeof xpGain !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const db = getDb();

    const existing = db
      .prepare('SELECT * FROM leaderboard WHERE nickname = ?')
      .get(nickname) as any;

    if (existing) {
      db.prepare(`
        UPDATE leaderboard
        SET xp = xp + ?,
            level = ?,
            wins = wins + ?,
            games_played = games_played + 1,
            updated_at = strftime('%s','now')
        WHERE nickname = ?
      `).run(
        xpGain,
        Math.floor(Math.sqrt((existing.xp + xpGain) / 100)),
        win ? 1 : 0,
        nickname
      );
    } else {
      db.prepare(`
        INSERT INTO leaderboard (nickname, emoji, xp, level, wins, games_played)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(
        nickname,
        emoji || '🎮',
        xpGain,
        Math.floor(Math.sqrt(xpGain / 100)),
        win ? 1 : 0
      );
    }

    db.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Leaderboard API] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
