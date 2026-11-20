'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  // Hide navigation on active game screen to maximize screen space
  if (pathname.startsWith('/game/')) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Domov', icon: '🎮' },
    { href: '/leaderboard', label: 'Rebríček', icon: '🏆' },
    { href: '/settings', label: 'Nastavenia', icon: '⚙️' },
    { href: '/feedback', label: 'Feedback', icon: '💬' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-vc-dark/90 backdrop-blur-lg border-t border-white/10 px-3 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 select-none ${
                isActive
                  ? 'text-vc-teal drop-shadow-[0_0_10px_rgba(0,229,212,0.8)] scale-105 font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="text-[10px] uppercase tracking-wider">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-vc-teal mt-0.5 shadow-[0_0_6px_#00E5D4]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
