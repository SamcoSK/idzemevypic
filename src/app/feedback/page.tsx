'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { NeonButton } from '@/components/NeonButton';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';

export default function FeedbackPage() {
  const { playSoundEffect } = usePlayerProfile();
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Napíš nám prosím krátky komentár');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          text: text.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        playSoundEffect('win');
      } else {
        setError('Nepodarilo sa odoslať spätnú väzbu');
        playSoundEffect('wrong');
      }
    } catch (e) {
      setError('Chyba spojenia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between p-4 max-w-md mx-auto space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/"
          className="text-vc-teal text-xl active:scale-90 transition-transform font-bold"
        >
          ←
        </Link>
        <h1 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-vc-pink to-vc-teal uppercase">
          💬 Spätná väzba
        </h1>
      </div>

      {submitted ? (
        <GlassCard glow="teal" className="p-6 text-center space-y-4 my-auto animate-scale-up">
          <span className="text-5xl">❤️</span>
          <h2 className="text-xl font-display font-bold text-white uppercase">
            Ďakujeme za feedback!
          </h2>
          <p className="text-sm text-white/80">
            Tvoja spätná väzba bola uložená lokálne do databázy a pomôže nám hru vylepšiť.
          </p>
          <div className="pt-2">
            <Link href="/">
              <NeonButton variant="primary" fullWidth size="md">
                🎮 Späť na domov
              </NeonButton>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <GlassCard glow="pink" className="p-5 space-y-4 my-auto">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-display font-bold text-white uppercase">
              Ako sa ti páčila hra?
            </h2>
            <p className="text-xs text-white/70">
              Povedz nám svoje nápady na nové minihry alebo otázky!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    playSoundEffect('click');
                  }}
                  className={`text-3xl transition-transform active:scale-75 ${
                    star <= rating ? 'scale-110 drop-shadow-[0_0_8px_#FFC857]' : 'opacity-30 grayscale'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-vc-gold font-bold mb-1">
                Tvoj názor / Nápad na otázku:
              </label>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
                rows={4}
                maxLength={500}
                placeholder="Napr. Pridajte viac otázok o Tatrách, novú minihru..."
                className="w-full bg-black/60 border border-white/20 focus:border-vc-pink rounded-xl p-3 text-white text-sm outline-none resize-none placeholder-white/30"
              />
              <span className="text-[10px] text-white/50 block text-right mt-0.5">
                {text.length} / 500
              </span>
            </div>

            {error && (
              <p className="text-xs text-red-400 font-semibold text-center">{error}</p>
            )}

            <NeonButton
              variant="primary"
              fullWidth
              size="lg"
              type="submit"
              disabled={submitting || !text.trim()}
            >
              {submitting ? 'Odosielam...' : '✉️ Odoslať spätnú väzbu'}
            </NeonButton>
          </form>
        </GlassCard>
      )}

      <p className="text-center text-[11px] text-white/40">
        IdzemeVypic • Vyrobené na Slovensku 🇸🇰
      </p>
    </div>
  );
}
