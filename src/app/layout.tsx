// app/layout.tsx (or RootLayout.tsx)

import './globals.css';
import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';

const lexend = Lexend({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ShareMitra - YouTube & Instagram Engagement Services',
  description: 'Boost your social media presence with real likes, comments, and replies on YouTube and Instagram. Professional engagement services for content creators.',
  icons: {
    icon: '/logo.png',       // favicon
    apple: '/logo.png',      // touch icon for Apple devices
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={lexend.className}>{children}</body>
    </html>
  );
}
