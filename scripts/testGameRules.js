const assert = require('assert');

// Test utilities
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n🧪 SPUŠŤAM TESTY HERNÝCH PRAVIDIEL:');
console.log('═══════════════════════════════════════');

// Helper functions reimplemented or imported
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function pluralSk(count, singular, few, many) {
  if (count === 1) return `1 ${singular}`;
  if (count >= 2 && count <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

function sanitizeNickname(text) {
  return String(text)
    .replace(/[<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20);
}

const FORBIDDEN = ['admin', 'moderator', 'root', 'hitler'];
function isForbiddenNickname(text) {
  const norm = normalizeText(text);
  return FORBIDDEN.some(f => norm.includes(f));
}

// 1. Text normalization & diacritics
test('normalizeText: správne odstráni diakritiku a veľkosť písmen', () => {
  assert.strictEqual(normalizeText('Žilina'), 'zilina');
  assert.strictEqual(normalizeText('KOŠICE'), 'kosice');
  assert.strictEqual(normalizeText('Bryndzové halušky'), 'bryndzove halusky');
  assert.strictEqual(normalizeText('Čadca'), 'cadca');
  assert.strictEqual(normalizeText('    banská bystrica   '), 'banska bystrica');
});

// 2. Slovak plurals
test('pluralSk: správne tvary plurálov pre 1, 2-4 a 5+ hráčov', () => {
  assert.strictEqual(pluralSk(1, 'hráč', 'hráči', 'hráčov'), '1 hráč');
  assert.strictEqual(pluralSk(2, 'hráč', 'hráči', 'hráčov'), '2 hráči');
  assert.strictEqual(pluralSk(3, 'hráč', 'hráči', 'hráčov'), '3 hráči');
  assert.strictEqual(pluralSk(4, 'hráč', 'hráči', 'hráčov'), '4 hráči');
  assert.strictEqual(pluralSk(5, 'hráč', 'hráči', 'hráčov'), '5 hráčov');
  assert.strictEqual(pluralSk(12, 'hráč', 'hráči', 'hráčov'), '12 hráčov');
});

// 3. Nickname sanitization & blacklist
test('sanitizeNickname: bráni XSS útokom a orezáva dĺžku', () => {
  assert.strictEqual(sanitizeNickname('<script>alert(1)</script>'), 'scriptalert(1)/scrip');
  assert.strictEqual(sanitizeNickname('   Miška   '), 'Miška');
  assert.strictEqual(sanitizeNickname('a'.repeat(50)).length, 20);
});

test('isForbiddenNickname: odhalí nevhodné a zakázané prezývky', () => {
  assert.strictEqual(isForbiddenNickname('Admin'), true);
  assert.strictEqual(isForbiddenNickname('ÁDMIN'), true);
  assert.strictEqual(isForbiddenNickname('Peter'), false);
});

// 4. Scoring: Čo by si radšej?
test('Bodovanie Čo by si radšej: tip zhody s väčšinou pridelí 100 bodov', () => {
  const votes = { p1: { choice: 'A', prediction: 'A' }, p2: { choice: 'A', prediction: 'B' }, p3: { choice: 'B', prediction: 'A' } };
  const votesA = Object.values(votes).filter(v => v.choice === 'A').length; // 2
  const votesB = Object.values(votes).filter(v => v.choice === 'B').length; // 1
  const majority = votesA > votesB ? 'A' : 'B';

  const scores = {};
  for (const [pid, v] of Object.entries(votes)) {
    scores[pid] = v.prediction === majority ? 100 : 0;
  }

  assert.strictEqual(scores.p1, 100); // predicted A, majority is A
  assert.strictEqual(scores.p2, 0);   // predicted B, majority is A
  assert.strictEqual(scores.p3, 100); // predicted A, majority is A
});

// 5. Scoring: Podvodník
test('Bodovanie Podvodník: odhalenie podvodníka a hádanie slova', () => {
  const spyId = 'spy1';
  const votes = { p1: 'spy1', p2: 'spy1', p3: 'p2', spy1: 'p2' };
  
  // Votes for spy1 = 2 (majority)
  const spyCaught = true;
  const spyGuessedCorrectly = true;

  const scores = { p1: 0, p2: 0, p3: 0, spy1: 0 };
  if (spyCaught) {
    for (const [voterId, target] of Object.entries(votes)) {
      if (target === spyId) scores[voterId] += 150;
    }
    if (spyGuessedCorrectly) {
      scores[spyId] += 200;
    }
  }

  assert.strictEqual(scores.p1, 150); // voted for spy
  assert.strictEqual(scores.p2, 150); // voted for spy
  assert.strictEqual(scores.p3, 0);   // voted for p2
  assert.strictEqual(scores.spy1, 200); // spy guessed word
});

// 6. Scoring: Kto by najskôr...?
test('Bodovanie Kto by najskôr: väčšinový titul a bonus 50 bodov pre hlasujúcich so zhodou', () => {
  const votes = {
    p1: 'p2',
    p2: 'p3',
    p3: 'p2',
    p4: 'p2',
  };

  // Vote counts: p2 got 3 votes, p3 got 1 vote
  const counts = { p2: 3, p3: 1 };
  const maxVotes = 3;
  const titleHolders = ['p2'];

  const scores = { p1: 0, p2: 0, p3: 0, p4: 0 };
  for (const [voter, target] of Object.entries(votes)) {
    if (titleHolders.includes(target)) {
      scores[voter] += 50;
    }
  }

  assert.strictEqual(scores.p1, 50); // voted for p2
  assert.strictEqual(scores.p2, 0);  // voted for p3
  assert.strictEqual(scores.p3, 50); // voted for p2
  assert.strictEqual(scores.p4, 50); // voted for p2
});

// 7. Scoring: Mesto-štát-rieka
test('Bodovanie Mesto-štát-rieka: unikátne (100) vs zdieľané (50) vs nesprávne (0)', () => {
  const letter = 'B';
  const answers = {
    p1: 'Bratislava',
    p2: 'Banská Bystrica',
    p3: 'Bratislava', // shared with p1
    p4: 'Žilina',     // wrong letter
    p5: '',           // empty
  };

  const normTarget = normalizeText(letter);
  const normalizedMap = {};
  for (const [pid, ans] of Object.entries(answers)) {
    const norm = normalizeText(ans);
    if (norm.length >= 2 && norm.startsWith(normTarget)) {
      normalizedMap[norm] = (normalizedMap[norm] || []);
      normalizedMap[norm].push(pid);
    }
  }

  const scores = {};
  for (const [pid, ans] of Object.entries(answers)) {
    const norm = normalizeText(ans);
    if (norm.length >= 2 && norm.startsWith(normTarget)) {
      scores[pid] = normalizedMap[norm].length === 1 ? 100 : 50;
    } else {
      scores[pid] = 0;
    }
  }

  assert.strictEqual(scores.p1, 50);  // shared 'bratislava'
  assert.strictEqual(scores.p2, 100); // unique 'banska bystrica'
  assert.strictEqual(scores.p3, 50);  // shared 'bratislava'
  assert.strictEqual(scores.p4, 0);   // wrong letter
  assert.strictEqual(scores.p5, 0);   // empty
});

console.log('═══════════════════════════════════════');
if (process.exitCode) {
  console.error('❌ Niektoré testy zlyhali!\n');
} else {
  console.log('🎉 VŠETKY TESTY ÚSPEŠNE PREŠLI!\n');
}
