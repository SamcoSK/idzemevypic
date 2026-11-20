const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'game.db');
const db = new Database(dbPath);

console.log('🌱 Inicializujem databázu a overujem herný obsah...');

// Create tables
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
    content_mode TEXT NOT NULL DEFAULT 'mix',
    status TEXT NOT NULL DEFAULT 'waiting',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    lobby_code TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

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

console.log('✓ Databázové tabuľky pripravené');

// Check content
const ktoByNajskor = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/kto-by-najskor.json'), 'utf8'));
const coBySiRadej = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/co-by-si-radej.json'), 'utf8'));
const podvodnik = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/podvodnik.json'), 'utf8'));
const mestoStatRieka = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/mesto-stat-rieka.json'), 'utf8'));

console.log('\n📊 Štatistika herného obsahu:');
console.log('═══════════════════════════════════════');
console.log(`1. Kto by najskôr...?: ${ktoByNajskor.length} otázok`);
const ktoMierne = ktoByNajskor.filter(q => q.ostrost === 'mierne').length;
const ktoOdvazne = ktoByNajskor.filter(q => q.ostrost === 'odvazne').length;
console.log(`   - Mierne (30%):   ${ktoMierne} otázok`);
console.log(`   - Odvážne (70%):  ${ktoOdvazne} otázok`);

console.log(`2. Čo by si radšej?:   ${coBySiRadej.length} otázok`);
const coMierne = coBySiRadej.filter(q => q.ostrost === 'mierne').length;
const coOdvazne = coBySiRadej.filter(q => q.ostrost === 'odvazne').length;
console.log(`   - Mierne:         ${coMierne} otázok`);
console.log(`   - Odvážne (18+):  ${coOdvazne} otázok`);

console.log(`3. Podvodník:          ${podvodnik.length} tém/slov`);
const podvMierne = podvodnik.filter(q => q.ostrost === 'mierne').length;
const podvOdvazne = podvodnik.filter(q => q.ostrost === 'odvazne').length;
console.log(`   - Mierne:         ${podvMierne} tém`);
console.log(`   - Odvážne (18+):  ${podvOdvazne} tém`);

console.log(`4. Mesto-štát-rieka:   ${mestoStatRieka.pismena.length} povolených písmen, ${mestoStatRieka.kategorii.length} kategórií`);
console.log('═══════════════════════════════════════');
console.log('🎉 Seed úspešne dokončený!');

db.close();
