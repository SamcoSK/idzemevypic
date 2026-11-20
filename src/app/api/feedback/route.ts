import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  const dbPath = path.join(process.cwd(), 'data', 'game.db');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 0,
      lobby_code TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);

  return db;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message || body.text;
    const rating = body.rating || 5;
    const lobbyCode = body.lobbyCode || null;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Správa je povinná' }, { status: 400 });
    }
    if (message.length > 500) {
      return NextResponse.json({ error: 'Správa je príliš dlhá (max 500 znakov)' }, { status: 400 });
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Hodnotenie musí byť 1–5' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO feedback (message, rating, lobby_code)
      VALUES (?, ?, ?)
    `).run(message.trim(), rating, lobbyCode || null);
    db.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
