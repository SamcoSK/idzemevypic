import type { Metadata, Viewport } from 'next';
import { Bungee, Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

const bungee = Bungee({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bungee',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'IdzemeVypic 🍺',
  description: 'Slovenská multiplayerová párty hra pre dobrú náladu!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IdzemeVypic',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'IdzemeVypic 🍺',
    description: 'Slovenská multiplayerová párty hra!',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2B0A4A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" className={`${bungee.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`font-body antialiased min-h-dvh vc-gradient-bg`}>
        <PWAInstallPrompt />
        <main className="min-h-dvh pb-16">{children}</main>
        <Navigation />
      </body>
    </html>
  );
}
