'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, FileText, Home, Map, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const items = [['/dashboard', 'Dashboard', Home], ['/assistant', 'Ask AI', Sparkles], ['/documents', 'Documents', FileText], ['/roadmaps', 'Roadmaps', Map], ['/resources', 'Resources', BookOpen], ['/profile', 'Profile', UserRound]] as const;

export function DashboardShell({ children, userName, preferredLanguage }: { children: React.ReactNode; userName: string; preferredLanguage: 'en' | 'hi' | 'hinglish' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [language, setLanguage] = useState(preferredLanguage);
  const [languageError, setLanguageError] = useState('');
  async function logout() { try { await createSupabaseBrowserClient().auth.signOut(); } finally { router.replace('/login'); router.refresh(); } }
  async function updateLanguage(nextLanguage: 'en' | 'hi' | 'hinglish') {
    const previousLanguage = language;
    setLanguage(nextLanguage); setLanguageError('');
    try {
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ preferred_language: nextLanguage }) });
      if (!response.ok) throw new Error('Language preference could not be saved.');
      window.dispatchEvent(new CustomEvent('nyaya-language-change', { detail: nextLanguage }));
    } catch { setLanguage(previousLanguage); setLanguageError('Language preference could not be saved.'); }
  }
  const currentLabel = items.find(([href]) => href === pathname)?.[1] ?? 'Dashboard';
  return <div className="min-h-screen bg-paper md:flex">
    <aside className="hidden w-64 shrink-0 flex-col bg-navy p-6 text-white md:flex"><Link href="/dashboard" className="mb-12 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-500 font-serif text-xl">N<span className="text-teal">•</span></span><span><strong className="block text-sm">NyayaSetu</strong><small className="text-[9px] text-slate-400">AI legal navigation</small></span></Link><p className="mb-3 text-[9px] font-bold tracking-[.18em] text-slate-400">WORKSPACE</p><nav className="grid gap-1">{items.map(([href, label, Icon]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-xs ${pathname === href ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}><Icon size={16}/>{label}</Link>)}</nav><div className="mt-auto rounded-lg border border-slate-700 bg-slate-800 p-3 text-[10px] text-slate-300"><ShieldCheck size={16} className="mb-2 text-teal"/><strong className="block text-white">Your information is protected</strong><span>Private access and clear deletion controls.</span></div></aside>
    <main className="min-w-0 flex-1 pb-24 md:pb-0"><header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 md:px-10"><div className="text-xs text-slate-400">Workspace <span className="px-2">/</span><strong className="text-navy">{currentLabel}</strong></div><div className="flex items-center gap-3"><span className="hidden text-xs font-semibold text-navy sm:inline">{userName}</span><label htmlFor="preferred-language" className="sr-only">Preferred language</label><select id="preferred-language" value={language} onChange={(event) => updateLanguage(event.target.value as 'en' | 'hi' | 'hinglish')} className="focus-ring min-h-11 rounded-md border border-slate-200 bg-white px-2 text-xs"><option value="en">English</option><option value="hi">हिन्दी</option><option value="hinglish">Hinglish</option></select><button onClick={logout} className="min-h-11 rounded-md border border-slate-200 px-3 text-xs">Log out</button></div></header>{languageError && <p role="alert" className="px-5 py-2 text-xs text-rose-700 md:px-10">{languageError}</p>}{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">{items.slice(0, 4).concat([items[5]]).map(([href, label, Icon]) => <Link key={href} href={href} className={`flex min-h-12 min-w-11 flex-col items-center justify-center gap-1 rounded-lg text-[9px] ${pathname === href ? 'bg-teal/10 text-teal' : 'text-slate-500'} ${href === '/assistant' ? 'font-bold' : ''}`}><Icon size={18}/>{label}</Link>)}</nav>
  </div>;
}
