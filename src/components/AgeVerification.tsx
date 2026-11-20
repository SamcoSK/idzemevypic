'use client';

import React from 'react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';

interface AgeVerificationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onReject?: () => void;
}

export function AgeVerification({ isOpen, onConfirm, onReject }: AgeVerificationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <GlassCard glow="pink" className="max-w-md w-full text-center space-y-5 border-vc-pink/60">
        {/* Warning Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-vc-pink/20 border-2 border-vc-pink flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(255,46,147,0.8)]">
          🔞
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black font-display text-white uppercase tracking-wide">
            Potvrdenie veku 18+
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Hra <strong className="text-vc-gold">IdzemeVypic</strong> obsahuje pikantné otázky, alkoholové témy a párty obsah pre dospelých.
          </p>
          <p className="text-xs text-vc-teal font-semibold">
            Máš viac ako 18 rokov a súhlasíš so zobrazením obsahu pre dospelých?
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <NeonButton
            variant="primary"
            fullWidth
            size="lg"
            pulsing
            onClick={onConfirm}
          >
            🔥 Áno, mám 18+ rokov
          </NeonButton>

          <NeonButton
            variant="ghost"
            fullWidth
            size="sm"
            onClick={() => {
              if (onReject) onReject();
              else alert('Pre hranie 18+ obsahu musíš mať aspoň 18 rokov. V nastaveniach môžeš zvoliť režim mierne.');
            }}
          >
            Mám menej ako 18 rokov (len mierny režim)
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}
