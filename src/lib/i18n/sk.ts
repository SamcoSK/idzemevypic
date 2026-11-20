// Slovak UI texts for IdzemeVypic
export const sk = {
  // App
  appName: 'IdzemeVypic',
  tagline: 'Párty hra pre dobrú náladu 🍺',
  taglineSub: 'Zahraj sa so svojimi kamarátmi!',

  // Home page
  home: {
    createLobby: '🎮 Vytvoriť lobby',
    joinLobby: '🔑 Pripojiť sa kódom',
    enterCode: 'Zadaj 5-znakový kód...',
    joinBtn: 'Pripojiť sa',
    or: 'alebo',
  },

  // Age verification
  ageVerification: {
    title: '🔞 Overenie veku',
    message: 'Táto hra obsahuje otázky pre dospelých 18+. Si starší/staršia ako 18 rokov?',
    confirm: '✅ Áno, mám 18+',
    deny: '❌ Nie, som mladší/mladšia',
    denied: 'Táto aplikácia je určená len pre osoby staršie ako 18 rokov.',
  },

  // Nickname modal
  nickname: {
    title: 'Ako sa voláš?',
    placeholder: 'Tvoja prezývka...',
    chooseEmoji: 'Vyber si avatara:',
    confirm: '✅ Potvrdiť',
    tooShort: 'Prezývka musí mať aspoň 2 znaky',
    tooLong: 'Prezývka môže mať max. 20 znakov',
    forbidden: 'Táto prezývka nie je povolená',
    chooseEmojiFirst: 'Vyber si emoji avatara',
  },

  // Lobby
  lobby: {
    title: 'Lobby',
    code: 'Kód lobby:',
    copyCode: '📋 Kopírovať kód',
    codeCopied: '✅ Skopírované!',
    scanQr: 'Alebo naskenuj QR kód:',
    players: 'Hráči',
    host: 'Hostiteľ',
    waitingForHost: '⏳ Čakáme na hostiteľa...',
    selectGame: 'Vyber hru:',
    rounds: 'Počet kôl:',
    startGame: '🚀 Spustiť hru',
    kickPlayer: '🚫 Vyhodiť',
    leaveGame: '🚪 Odísť',
    minPlayersWarning: (min: number) => `Potrebuješ aspoň ${min} hráčov`,
    playerCount: (n: number) => {
      if (n === 1) return '1 hráč';
      if (n >= 2 && n <= 4) return `${n} hráči`;
      return `${n} hráčov`;
    },
    contentMode: 'Obsah:',
    maxPlayers: 'Max hráčov:',
    shareInvite: '📤 Zdieľať pozvánku',
  },

  // Game modes
  gameModes: {
    'co-by-radej': 'Čo by si radšej?',
    'podvodnik': 'Podvodník',
    'kto-by-najskor': 'Kto by najskôr?',
    'mesto-stat-rieka': 'Mesto-štát-rieka',
  },

  // Content modes
  contentModes: {
    mierne: '😇 Mierne',
    mix: '🌶️ Mix',
    odvazne: '🔥 Odvážne',
  },

  // Game - general
  game: {
    round: 'Kolo',
    of: 'z',
    timeLeft: 'Zostávajúci čas:',
    vote: 'Hlasovať',
    skip: 'Preskočiť',
    nextRound: 'Ďalšie kolo',
    results: 'Výsledky',
    finalResults: 'Záverečné výsledky',
    yourScore: 'Tvoje skóre',
    playAgain: '🔄 Hrať znova',
    backToMenu: '🏠 Domov',
    waiting: 'Čakáme na ostatných...',
    allVoted: '✅ Všetci hlasovali!',
  },

  // Co by si radšej
  coByRadej: {
    question: 'Čo by si radšej?',
    optionA: 'Možnosť A',
    optionB: 'Možnosť B',
    or: 'ALEBO',
    voted: 'Hlasoval/a si!',
    result: (percent: number) => `${percent}% hráčov vybralo toto`,
    correct: '+100 bodov! Správny tip!',
    wrong: 'Žiaľ, nie to, čo vybrala väčšina.',
  },

  // Podvodník
  podvodnik: {
    yourWord: 'Tvoje slovo:',
    impostorMessage: '🕵️ Si PODVODNÍK! Uhádni o čom hovoria ostatní.',
    discuss: 'Diskutujte a odhaľte podvodníka!',
    vote: 'Kto je podvodník?',
    impostorGuess: 'Uhádni slovo:',
    correct150: '+150 bodov! Odhalil/a si podvodníka!',
    impostorWin200: '+200 bodov! Podvodník uhádol slovo!',
    caught: 'Podvodník odhalený!',
    notCaught: 'Podvodník unikol!',
    reveal: 'Podvodník bol:',
    theWord: 'Slovo bolo:',
  },

  // Kto by najskôr
  ktoBynajskor: {
    question: 'Kto by z vás najskôr...',
    vote: 'Vyber hráča:',
    winner: 'Titul kola:',
    majorityVote: '+50 bodov za hlasovanie s väčšinou!',
    theAnswer: 'Odpovedalo sa:',
  },

  // Mesto-štát-rieka
  mestoStatRieka: {
    letter: 'Písmeno:',
    categories: ['Mesto', 'Štát', 'Rieka', 'Rastlina', 'Zviera', 'Meno'],
    type: 'Píš slová na písmeno',
    unique100: '+100 bodov za unikátnu odpoveď!',
    shared50: '+50 bodov za zdieľanú odpoveď.',
    empty0: '0 bodov za prázdnu odpoveď.',
    timeUp: '⏰ Čas vypršal!',
    stop: '🛑 STOP!',
  },

  // Scoreboard
  scoreboard: {
    title: 'Výsledková tabuľka',
    rank: 'Poradie',
    player: 'Hráč',
    score: 'Skóre',
    xp: 'XP',
    level: 'Level',
    winner: '🏆 Víťaz',
    top3: ['🥇', '🥈', '🥉'],
  },

  // Errors
  errors: {
    lobbyNotFound: 'Lobby s týmto kódom neexistuje.',
    lobbyFull: 'Lobby je plné (max 12 hráčov).',
    gameStarted: 'Hra už začala.',
    nicknameTaken: 'Táto prezývka je už obsadená.',
    notHost: 'Túto akciu môže vykonať iba hostiteľ.',
    rateLimited: 'Príliš veľa akcií. Počkaj chvíľu.',
    networkError: 'Chyba siete. Skúste znova.',
    generic: 'Nastala chyba. Skúste znova.',
    minPlayers: (min: number) => `Potrebuješ aspoň ${min} hráčov na spustenie tejto hry.`,
  },

  // Feedback
  feedback: {
    button: '💬 Spätná väzba',
    title: 'Pošli nám spätnú väzbu',
    placeholder: 'Napíš svoje pripomienky...',
    send: 'Odoslať',
    thanks: '🙏 Ďakujeme za spätnú väzbu!',
  },
};

export type SkTranslations = typeof sk;
