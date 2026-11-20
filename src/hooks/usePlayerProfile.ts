'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_EMOJI } from '@/lib/constants';

export interface PlayerProfile {
  nickname: string;
  emoji: string;
  syncCode?: string;
  ageVerified: boolean;
  sound: boolean;
  vibration: boolean;
  contentMode: 'mierne' | 'mix' | 'odvazne';
}

const STORAGE_KEY = 'idzemevypic_profile';

export function usePlayerProfile() {
  const [profile, setProfile] = useState<PlayerProfile>({
    nickname: '',
    emoji: DEFAULT_EMOJI,
    ageVerified: false,
    sound: true,
    vibration: true,
    contentMode: 'mix',
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.warn('Failed to read profile from localStorage');
    }
    setLoaded(true);
  }, []);

  const updateProfile = (updates: Partial<PlayerProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save profile to localStorage');
      }
      return next;
    });
  };

  const playSoundEffect = (type: 'click' | 'correct' | 'wrong' | 'timer' | 'win') => {
    if (!profile.sound) return;
    try {
      // Audio synthesis using Web Audio API for lightweight, zero-file sound effects!
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'timer') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'win') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      // AudioContext may be restricted before user gesture
    }
  };

  const triggerVibration = (pattern: number | number[] = 50) => {
    if (!profile.vibration) return;
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  };

  return {
    profile,
    loaded,
    updateProfile,
    playSoundEffect,
    triggerVibration,
  };
}
