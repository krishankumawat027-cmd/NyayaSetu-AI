'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Explanation = { term: string; simpleDefinition: string; hindiMeaning: string; whyItMatters: string; example: string; verificationNote: string; sources: { id: string; name: string; url: string; reference: string }[] };

export function LegalTermWorkspace() {
  const [term, setTerm] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const syncLanguage = (event: Event) => {
      const nextLanguage = (event as CustomEvent<'en' | 'hi' | 'hinglish'>).detail;
      if (nextLanguage === 'en' || nextLanguage === 'hi' || nextLanguage === 'hinglish') setLanguage(nextLanguage);
    };
    window.addEventListener('nyaya-language-change', syncLanguage);
    fetch('/api/profile').then((response) => response.ok ? response.json() as Promise<{ profile?: { preferredLanguage?: 'en' | 'hi' | 'hinglish' } }> : null)
      .then((data) => { if (active && data?.profile?.preferredLanguage) setLanguage(data.profile.preferredLanguage); })
      .catch(() => undefined);
    return () => { active = false; window.removeEventListener('nyaya-language-change', syncLanguage); };
  }, []);

  async function changeLanguage(nextLanguage: 'en' | 'hi' | 'hinglish') {
    const previousLanguage = language;
    setLanguage(nextLanguage); setError('');
    try {
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ preferred_language: nextLanguage }) });
      if (!response.ok) throw new Error('Language preference could not be saved.');
      window.dispatchEvent(new CustomEvent('nyaya-language-change', { detail: nextLanguage }));
    } catch { setLanguage(previousLanguage); setError('Language preference could not be saved.'); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setExplanation(null);
    try {
      const response = await fetch('/api/legal-terms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ term, language }) });
      const result = await response.json() as { explanation?: Explanation; error?: string };
      if (!response.ok || !result.explanation) throw new Error(result.error ?? 'The term could not be explained.');
      setExplanation(result.explanation);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The term service is unavailable.'); }
    finally { setLoading(false); }
  }

  return <section id="legal-term" className="card p-5 sm:p-6" aria-labelledby="legal-term-title">
    <p className="eyebrow">LEGAL TERM EXPLAINER</p><h2 id="legal-term-title" className="serif mt-2 text-3xl text-navy">Understand a legal term</h2>
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
      <label htmlFor="legal-term-input" className="sr-only">Legal term</label><input id="legal-term-input" value={term} onChange={(event) => setTerm(event.target.value)} maxLength={120} required className="focus-ring min-h-11 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm" placeholder="For example: consumer complaint"/>
      <label htmlFor="legal-term-language" className="sr-only">Explanation language</label><select id="legal-term-language" value={language} onChange={(event) => changeLanguage(event.target.value as 'en' | 'hi' | 'hinglish')} className="focus-ring min-h-11 rounded-md border border-slate-200 bg-white px-3 text-xs"><option value="en">English</option><option value="hi">हिन्दी</option><option value="hinglish">Hinglish</option></select>
      <button disabled={loading} className="min-h-11 rounded-md bg-teal px-5 text-xs font-bold text-white disabled:opacity-60">{loading ? 'Explaining…' : 'Explain term'}</button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error} <button type="button" onClick={(event) => { event.preventDefault(); const form = event.currentTarget.closest('section')?.querySelector('form'); form?.requestSubmit(); }} className="underline">Retry</button></p>}
    {explanation && <div className="mt-6 space-y-4" aria-live="polite"><h3 className="text-lg font-bold">{explanation.term}</h3><section><h4 className="text-sm font-bold">Simple definition</h4><p className="mt-1 text-sm leading-6 text-slate-600">{explanation.simpleDefinition}</p></section><section><h4 className="text-sm font-bold">Hindi meaning</h4><p className="mt-1 text-sm leading-6 text-slate-600">{explanation.hindiMeaning}</p></section><section><h4 className="text-sm font-bold">Why it matters</h4><p className="mt-1 text-sm leading-6 text-slate-600">{explanation.whyItMatters}</p></section><section><h4 className="text-sm font-bold">Illustrative example</h4><p className="mt-1 text-sm leading-6 text-slate-600">{explanation.example}</p></section><section><h4 className="text-sm font-bold">Source check</h4><p className="mt-1 text-sm leading-6 text-slate-600">{explanation.verificationNote}</p>{explanation.sources.map((source) => <p className="mt-2 text-sm" key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal underline">{source.name}</a> — {source.reference}</p>)}</section></div>}
  </section>;
}
