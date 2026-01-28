// src/app/layout.tsx
import React from 'react';
import type { Metadata } from 'next';
import './styles/index.css';
import './styles/fonts.css';
import './styles/tailwind.css';
import './styles/theme.css';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/ThemeProvider';

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
  const themeScript = `
(function() {
  var html = document.documentElement;
  html.classList.remove('theme-default', 'theme-black', 'theme-blue');
  var t = localStorage.getItem('pilot-theme');
  var c = 'theme-default';
  if (t === 'black') c = 'theme-black';
  else if (t === 'blue') c = 'theme-blue';
  html.classList.add(c);
})();
`;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
