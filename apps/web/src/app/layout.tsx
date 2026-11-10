import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { BrandingProvider } from '@/lib/branding';
import { THEME_BOOT } from '@/components/ThemeToggle';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Theme choice from localStorage, applied before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <BrandingProvider>{children}</BrandingProvider>
      </body>
    </html>
  );
}
