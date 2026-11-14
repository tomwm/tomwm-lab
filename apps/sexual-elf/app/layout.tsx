import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { AppContextProvider } from '@/context/AppContext';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const manrope = Manrope({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Sexual Elf — Sexual Health Risk Assessment',
  description:
    'Understand your sexual health risks with Sylvan, your knowledgeable elf guide. Evidence-based, non-judgmental, session-only.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-ink-900 antialiased">
        <AppContextProvider>{children}</AppContextProvider>
      </body>
    </html>
  );
}
