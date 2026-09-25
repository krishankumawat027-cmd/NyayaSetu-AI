'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle, Sparkles } from 'lucide-react';

type Language = 'en' | 'hi' | 'hinglish';
type LegalAnswer = {
  summary: string;
  category: string;
  importantFacts: string[];
  generalInformation: string;
  nextSteps: string[];
  evidence: string[];
  cautions: string[];
  sources: { name: string; reference: string; lastChecked?: string }[];
  professionalHelp: string;
};
type Source = { name: string; url: string; reference: string; lastChecked?: string };

export function QueryWorkspace() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ answer: LegalAnswer; sources: Source[] } | null>(null);

  useEffect(() => {
    let active = true;
    const syncLanguage = (event: Event) => {
      const nextLanguage = (event as CustomEvent<Language>).detail;
      if (nextLanguage === 'en' || nextLanguage === 'hi' || nextLanguage === 'hinglish') setLanguage(nextLanguage);
    };
    window.addEventListener('nyaya-language-change', syncLanguage);
    fetch('/api/profile').then((response) => response.ok ? response.json() as Promise<{ profile?: { preferredLanguage?: Language } }> : null)
      .then((data) => { if (active && data?.profile?.preferredLanguage) setLanguage(data.profile.preferredLanguage); })
      .catch(() => undefined);
    return () => { active = false; window.removeEventListener('nyaya-language-change', syncLanguage); };
  }, []);

  async function updateLanguage(nextLanguage: Language) {
    const previousLanguage = language;
    setLanguage(nextLanguage); setError('');
    try {
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ preferred_language: nextLanguage }) });
      if (!response.ok) throw new Error('Language preference could not be saved.');
      window.dispatchEvent(new CustomEvent('nyaya-language-change', { detail: nextLanguage }));
    } catch { setLanguage(previousLanguage); setError('Language preference could not be saved.'); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setError('Describe your situation before submitting.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/legal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: query, language }),
      });
      const data = await response.json() as { answer?: LegalAnswer; sources?: Source[]; error?: string };
      if (!response.ok || !data.answer || !data.sources) throw new Error(data.error ?? 'The assistant could not complete this request.');
      setResult({ answer: data.answer, sources: data.sources });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The assistant is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return <section className="card overflow-hidden" aria-labelledby="assistant-title">
    <div className="bg-navy p-6 text-white">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="eyebrow text-teal">ASK NYAYASETU</p><h2 id="assistant-title" className="serif text-2xl">What would you like help understanding?</h2></div>
        <span className="shrink-0 rounded bg-slate-700 px-2 py-1 text-[9px]"><Sparkles size={12} className="mr-1 inline text-teal" aria-hidden="true"/>AI assistant</span>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="legal-query" className="sr-only">Describe your legal situation</label>
        <textarea id="legal-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={4000} required aria-describedby="query-hint query-count query-error" placeholder="Describe your legal situation in English, Hindi or Hinglish…" className="min-h-32 w-full resize-y rounded-md border border-slate-600 bg-slate-800 p-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span id="query-hint" className="text-xs text-slate-300">Submitting sends your question to Google Gemini. Avoid sharing names, account numbers, or other identifying details.</span>
          <span id="query-count" className="text-xs text-slate-300">{query.length} / 4,000</span>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="query-language" className="text-xs text-slate-200">Response language</label>
          <select id="query-language" value={language} onChange={(event) => updateLanguage(event.target.value as Language)} className="focus-ring min-h-11 rounded-md border border-slate-600 bg-slate-800 px-3 text-xs text-white">
            <option value="en">English</option><option value="hi">हिन्दी</option><option value="hinglish">Hinglish</option>
          </select>
          <button type="submit" disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal px-5 text-xs font-bold text-white disabled:opacity-60">
            {loading ? <><LoaderCircle className="animate-spin" size={16} aria-hidden="true"/>Preparing information…</> : <>Explain, verify and plan <ArrowRight size={16} aria-hidden="true"/></>}
          </button>
        </div>
        {error && <div id="query-error" role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-xs text-rose-200"><span>{error}</span><button type="submit" disabled={loading} className="min-h-11 rounded border border-rose-200 px-3 underline">Try again</button></div>}
      </form>
    </div>
    {result && <div className="space-y-5 p-6" aria-live="polite">
      <span className="rounded bg-indigo-50 px-2 py-1 text-[9px] text-indigo-700">AI-generated general information</span>
      <section><p className="eyebrow">EXPLAIN · {result.answer.category}</p><h3 className="mt-2 text-sm font-bold">{result.answer.summary}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{result.answer.generalInformation}</p></section>
      <section><p className="eyebrow">IMPORTANT FACTS</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{result.answer.importantFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul></section>
      <section><p className="eyebrow">VERIFY</p><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">{result.sources.map((source) => <li key={source.url}><a className="font-semibold text-teal underline" href={source.url} target="_blank" rel="noreferrer">{source.name}</a> — {source.reference}{source.lastChecked && <span className="text-xs"> (checked {source.lastChecked})</span>}</li>)}</ul><p className="mt-2 text-xs text-slate-500">These are general information resources. Their relevance and currency should be checked for your specific question.</p></section>
      <section><p className="eyebrow">PLAN · POSSIBLE NEXT STEPS</p><ul className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">{result.answer.nextSteps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ul></section>
      <section><p className="eyebrow">EVIDENCE TO KEEP</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{result.answer.evidence.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section><p className="eyebrow">IMPORTANT CAUTIONS</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">{result.answer.cautions.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <p className="rounded bg-amber-50 p-3 text-xs leading-5 text-amber-900">{result.answer.professionalHelp} NyayaSetu AI provides general legal information for educational and informational purposes. It is not a substitute for professional legal advice.</p>
    </div>}
  </section>;
}
