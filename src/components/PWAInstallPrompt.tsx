'use client';

import React, { useState, useEffect } from 'react';
import { NeonButton } from './NeonButton';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-3 inset-x-3 z-50 max-w-md mx-auto bg-vc-dark/95 border-2 border-vc-teal rounded-2xl p-4 shadow-[0_0_25px_rgba(0,229,212,0.5)] backdrop-blur-md flex items-center justify-between gap-3 animate-slide-down">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📱</span>
        <div>
          <h4 className="text-sm font-bold text-white uppercase font-display">
            Nainštalovať aplikáciu
          </h4>
          <p className="text-xs text-white/70">
            Hraj rýchlejšie priamo z plochy mobilu
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NeonButton variant="secondary" size="sm" onClick={handleInstall}>
          Pridať
        </NeonButton>
        <button
          onClick={handleDismiss}
          className="text-white/50 hover:text-white p-1 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
