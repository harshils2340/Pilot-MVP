// src/app/layout.tsx
import React from 'react';
import type { Metadata } from 'next';
import './styles/index.css';
import './styles/fonts.css';
import './styles/tailwind.css';
import './styles/theme.css';

export const metadata: Metadata = {
  icons: {
    icon: '/file.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
