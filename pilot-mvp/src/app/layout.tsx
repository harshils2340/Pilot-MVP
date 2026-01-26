// src/app/layout.tsx
import React from 'react';
import type { Metadata } from 'next';
import './styles/index.css';
import './styles/fonts.css';
import './styles/tailwind.css';
import './styles/theme.css';
import { Toaster } from './components/ui/sonner';

export const metadata: Metadata = {
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
