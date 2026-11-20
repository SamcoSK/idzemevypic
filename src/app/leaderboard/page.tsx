'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { sk } from '@/lib/i18n/sk';

type Period = 'all' | 'week' | 'today';

interface LeaderboardPlayer {
  id: number;
  nickname: string;
  emoji: string;
  xp: number;
  level: number;
  wins: number;
  games_played: number;
  win_rate: number;
}

const PERIOD_LABELS: Record<Period, string> = {
  all: 'Všetko',
  week: 'Tento týždeň',
  today: 'Dnes',
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('all');
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    setVisible(false);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setPlayers(data.players || []);
        setLoading(false);
        setTimeout(() => setVisible(true), 50);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <main className="min-h-screen bg-vc-dark px-4 py-8 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/"
          className="text-vc-teal text-2xl active:scale-90 transition-transform"
          aria-label="Späť"
        >
          ←
        </Link>
        <h1
          className="font-bungee text-3xl text-transparent bg-clip-text"
          style={{ backgroundImage: 'linear-gradient(90deg, #FF2E93, #00E5D4)' }}
        >
          🏆 Rebríček
        </h1>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              period === p
                ? 'bg-vc-pink text-white shadow-[0_0_12px_#FF2E93]'
                : 'glass text-vc-teal border border-vc-teal/30 hover:border-vc-teal'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-vc-teal animate-pulse py-16 text-lg">Načítavam…</div>
      ) : players.length === 0 ? (
        <div className="text-center text-white/50 py-16 text-lg">
          Zatiaľ žiadni hráči 👻
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`glass rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 ${
                visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              } motion-reduce:transition-none`}
              style={{
                transitionDelay: visible ? `${index * 60}ms` : '0ms',
                borderLeft: index < 3 ? `3px solid ${['#FF2E93', '#00E5D4', '#FF7A3D'][index]}` : '3px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Rank */}
              <div className="text-2xl w-9 text-center flex-shrink-0">
                {index < 3 ? RANK_MEDALS[index] : <span className="text-white/40 font-bungee">#{index + 1}</span>}
              </div>

              {/* Emoji */}
              <div className="text-3xl w-10 text-center flex-shrink-0">{player.emoji}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate text-base">{player.nickname}</div>
                <div className="text-xs text-white/50 mt-0.5">
                  Lvl {player.level} · {player.games_played}{' '}
                  {player.games_played === 1 ? 'hra' : player.games_played >= 2 && player.games_played <= 4 ? 'hry' : 'hier'}
                </div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <div className="font-bungee text-vc-pink text-lg">{player.xp} XP</div>
                <div className="text-xs text-vc-teal">{player.win_rate}% výhra</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      {!loading && players.length > 0 && (
        <p className="text-center text-white/30 text-xs mt-6">
          Lokálny rebríček · aktualizuje sa po každej hre
        </p>
      )}
    </main>
  );
}
