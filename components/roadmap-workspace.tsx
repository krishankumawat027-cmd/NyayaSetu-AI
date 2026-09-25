'use client';

import { useEffect, useState, type FormEvent } from 'react';

type RoadmapStep = { id: string; title: string; body: string | null; completed: boolean };
type EvidenceItem = { id: string; label: string; completed: boolean };
type Roadmap = { id: string; title: string; category: string | null; progress: number; created_at: string; summary: { problem?: string; relevantInformation?: string; importantFacts?: string[]; cautions?: string[]; professionalHelp?: string }; resources: { id: string; name: string; organization: string; url: string; reference: string }[]; steps: RoadmapStep[]; evidence: EvidenceItem[] };
type Language = 'en' | 'hi' | 'hinglish';

async function responseError(response: Response) {
  const body = await response.json() as { error?: string };
  return body.error ?? 'The request could not be completed.';
}

export function RoadmapWorkspace({ initialLanguage }: { initialLanguage: Language }) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [language, setLanguage] = useState(initialLanguage);
  const [input, setInput] = useState('');
  const [evidenceDrafts, setEvidenceDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/roadmaps').then(async (response) => {
      if (!response.ok) throw new Error(await responseError(response));
      return response.json() as Promise<{ roadmaps: Roadmap[] }>;
    }).then((data) => { if (active) setRoadmaps(data.roadmaps); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Roadmaps could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const syncLanguage = (event: Event) => {
      const nextLanguage = (event as CustomEvent<Language>).detail;
      if (nextLanguage === 'en' || nextLanguage === 'hi' || nextLanguage === 'hinglish') setLanguage(nextLanguage);
    };
    window.addEventListener('nyaya-language-change', syncLanguage);
    return () => window.removeEventListener('nyaya-language-change', syncLanguage);
  }, []);

  async function createRoadmap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) return;
    setCreating(true); setError('');
    try {
      const response = await fetch('/api/roadmaps', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input, language }) });
      if (!response.ok) throw new Error(await responseError(response));
      const { roadmap } = await response.json() as { roadmap: Roadmap };
      setRoadmaps((existing) => [roadmap, ...existing]); setInput('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Roadmap generation failed. Please retry.'); }
    finally { setCreating(false); }
  }

  async function toggleStep(roadmap: Roadmap, step: RoadmapStep) {
    setBusyId(step.id); setError('');
    try {
      const response = await fetch(`/api/roadmaps/${roadmap.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ stepId: step.id, completed: !step.completed }) });
      if (!response.ok) throw new Error(await responseError(response));
      const { progress } = await response.json() as { progress: number };
      setRoadmaps((existing) => existing.map((item) => item.id === roadmap.id ? { ...item, progress, steps: item.steps.map((current) => current.id === step.id ? { ...current, completed: !current.completed } : current) } : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Step could not be updated.'); }
    finally { setBusyId(''); }
  }

  async function toggleEvidence(roadmap: Roadmap, evidence: EvidenceItem) {
    setBusyId(evidence.id); setError('');
    try {
      const response = await fetch(`/api/roadmaps/${roadmap.id}/evidence`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemId: evidence.id, completed: !evidence.completed }) });
      if (!response.ok) throw new Error(await responseError(response));
      setRoadmaps((existing) => existing.map((item) => item.id === roadmap.id ? { ...item, evidence: item.evidence.map((current) => current.id === evidence.id ? { ...current, completed: !current.completed } : current) } : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Evidence could not be updated.'); }
    finally { setBusyId(''); }
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>, roadmap: Roadmap) {
    event.preventDefault();
    const label = evidenceDrafts[roadmap.id]?.trim();
    if (!label) return;
    setBusyId(roadmap.id); setError('');
    try {
      const response = await fetch(`/api/roadmaps/${roadmap.id}/evidence`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label }) });
      if (!response.ok) throw new Error(await responseError(response));
      const { item } = await response.json() as { item: EvidenceItem };
      setRoadmaps((existing) => existing.map((current) => current.id === roadmap.id ? { ...current, evidence: [...current.evidence, item] } : current));
      setEvidenceDrafts((existing) => ({ ...existing, [roadmap.id]: '' }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Evidence could not be added.'); }
    finally { setBusyId(''); }
  }

  async function deleteRoadmap(roadmap: Roadmap) {
    if (!window.confirm(`Delete “${roadmap.title}” and its checklist?`)) return;
    setBusyId(roadmap.id); setError('');
    try {
      const response = await fetch(`/api/roadmaps/${roadmap.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await responseError(response));
      setRoadmaps((existing) => existing.filter((item) => item.id !== roadmap.id));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Roadmap could not be deleted.'); }
    finally { setBusyId(''); }
  }

  return <div className="space-y-6">
    <section className="card p-5 sm:p-6">
      <h2 className="text-base font-bold">Create a roadmap from your situation</h2>
      <form onSubmit={createRoadmap} className="mt-4 space-y-3">
        <label htmlFor="roadmap-input" className="sr-only">Describe your situation</label>
        <textarea id="roadmap-input" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} required rows={4} className="focus-ring w-full rounded-md border border-slate-200 p-3 text-sm" placeholder="Describe what happened. Avoid names and account numbers." />
        <p className="text-xs leading-5 text-slate-500">Submitting sends this description to Google Gemini and saves a copy with email addresses and phone numbers masked. Avoid including names, addresses, or other identifying details.</p>
        <button type="submit" disabled={creating} className="min-h-11 rounded-md bg-teal px-5 text-xs font-bold text-white disabled:opacity-60">{creating ? 'Generating and saving…' : 'Generate and save roadmap'}</button>
      </form>
    </section>
    {error && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {loading && <p role="status" className="text-sm text-slate-500">Loading your saved roadmaps…</p>}
    {!loading && roadmaps.length === 0 && <section className="card p-6 text-sm text-slate-500">No saved roadmaps yet. Describe a situation above to create one.</section>}
    {roadmaps.map((roadmap) => <details key={roadmap.id} className="card p-5 sm:p-6">
      <summary className="cursor-pointer list-none">
        <span className="flex flex-wrap items-start justify-between gap-3"><span><span className="eyebrow">{roadmap.category ?? 'POSSIBLE NEXT STEPS'}</span><strong className="mt-2 block text-lg text-navy">{roadmap.title}</strong><span className="mt-1 block text-xs text-slate-500">Created {new Date(roadmap.created_at).toLocaleDateString()}</span></span><span className="text-sm font-bold text-teal">{roadmap.progress}%</span></span>
        <span className="mt-3 block h-2 overflow-hidden rounded bg-slate-100"><span className="block h-full bg-teal" style={{ width: `${roadmap.progress}%` }} /></span>
      </summary>
      <div className="mt-6 space-y-6">
        {roadmap.summary && <section className="rounded-md bg-slate-50 p-4"><h3 className="text-sm font-bold">Relevant information</h3><p className="mt-2 text-sm leading-6 text-slate-600">{roadmap.summary.relevantInformation}</p>{roadmap.summary.importantFacts && <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{roadmap.summary.importantFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}{roadmap.summary.cautions?.map((caution) => <p key={caution} className="mt-2 text-xs text-amber-900">Caution: {caution}</p>)}{roadmap.summary.professionalHelp && <p className="mt-3 text-xs text-slate-600">{roadmap.summary.professionalHelp}</p>}</section>}
        <section><h3 className="text-sm font-bold">Possible steps</h3><ol className="mt-3 space-y-3">{roadmap.steps.map((step, index) => <li key={step.id} className="flex gap-3 rounded border border-slate-100 p-3"><input type="checkbox" checked={step.completed} disabled={busyId === step.id} onChange={() => toggleStep(roadmap, step)} aria-label={`Mark step ${index + 1} complete`} className="mt-1 h-5 w-5 accent-teal"/><span><strong className="text-sm">{index + 1}. {step.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{step.body}</span></span></li>)}</ol></section>
        {roadmap.resources.length > 0 && <section><h3 className="text-sm font-bold">Official resources</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{roadmap.resources.map((resource) => <li key={resource.id}><a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal underline">{resource.name}</a><span className="block text-xs text-slate-500">{resource.organization} · {resource.reference}</span></li>)}</ul></section>}
        <section><h3 className="text-sm font-bold">Evidence checklist · {roadmap.evidence.filter((item) => item.completed).length}/{roadmap.evidence.length} collected ({roadmap.evidence.length ? Math.round(roadmap.evidence.filter((item) => item.completed).length * 100 / roadmap.evidence.length) : 0}%)</h3><ul className="mt-3 space-y-2">{roadmap.evidence.map((item) => <li key={item.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={item.completed} disabled={busyId === item.id} onChange={() => toggleEvidence(roadmap, item)} aria-label={`Mark ${item.label} collected`} className="h-5 w-5 accent-teal"/><span>{item.label}</span></li>)}</ul><form onSubmit={(event) => addEvidence(event, roadmap)} className="mt-3 flex flex-wrap gap-2"><label htmlFor={`new-evidence-${roadmap.id}`} className="sr-only">Add an evidence item</label><input id={`new-evidence-${roadmap.id}`} value={evidenceDrafts[roadmap.id] ?? ''} onChange={(event) => setEvidenceDrafts((existing) => ({ ...existing, [roadmap.id]: event.target.value }))} maxLength={180} className="focus-ring min-h-11 min-w-0 flex-1 rounded border border-slate-200 px-3 text-sm" placeholder="Add evidence item"/><button disabled={busyId === roadmap.id} className="min-h-11 rounded border px-4 text-xs">Add item</button></form></section>
        <button type="button" disabled={busyId === roadmap.id} onClick={() => deleteRoadmap(roadmap)} className="min-h-11 rounded border border-rose-200 px-4 text-xs text-rose-700">Delete roadmap</button>
      </div>
    </details>)}
  </div>;
}
