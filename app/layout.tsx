import type { Metadata } from 'next';
import { DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });
const serif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-serif' });
export const metadata: Metadata = { title: 'NyayaSetu AI', description: 'Explain, verify, and plan your next legal-information step.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${jakarta.variable} ${serif.variable}`}>{children}</body></html>; }
