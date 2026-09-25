'use client';

import { useEffect, useState } from 'react';

type Resource = { id: string; name: string; organization: string; description: string; category: string; url: string; reference: string };

export function ResourceLibrary() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const response = await fetch('/api/resources');
    const data = await response.json() as { resources?: Resource[]; savedIds?: string[]; error?: string };
    if (!response.ok) throw new Error(data.error ?? 'Resources could not be loaded.');
    setResources(data.resources ?? []); setSavedIds(data.savedIds ?? []);
  }

  useEffect(() => {
    let active = true;
    Promise.resolve().then(load).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Resources could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function toggle(resource: Resource) {
    setBusyId(resource.id); setError('');
    const isSaved = savedIds.includes(resource.id);
    try {
      const response = await fetch('/api/resources', { method: isSaved ? 'DELETE' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceId: resource.id }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Resource could not be updated.');
      setSavedIds((current) => isSaved ? current.filter((id) => id !== resource.id) : [...current, resource.id]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Resource could not be updated.'); }
    finally { setBusyId(''); }
  }

  if (loading) return <p role="status" className="text-sm text-slate-500">Loading official resources…</p>;
  return <div className="space-y-4">
    {error && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {resources.length === 0 && <p className="card p-6 text-sm text-slate-500">No resources are currently available.</p>}
    <div className="grid gap-4 md:grid-cols-2">{resources.map((resource) => {
      const isSaved = savedIds.includes(resource.id);
      return <article className="card p-6" key={resource.id}>
        <span className="eyebrow">{resource.category}</span><h2 className="mt-3 text-lg font-bold">{resource.name}</h2>
        <p className="mt-1 text-xs font-semibold text-slate-500">{resource.organization}</p><p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
        <p className="mt-2 text-xs text-slate-500">{resource.reference}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3"><a className="focus-ring inline-flex min-h-11 items-center font-bold text-teal underline" href={resource.url} target="_blank" rel="noopener noreferrer">Open official resource<span className="sr-only">: {resource.name}</span></a><button type="button" disabled={busyId === resource.id} onClick={() => toggle(resource)} className="min-h-11 rounded-md border border-slate-200 px-4 text-xs font-semibold">{busyId === resource.id ? 'Saving…' : isSaved ? 'Remove saved resource' : 'Save resource'}</button></div>
      </article>;
    })}</div>
  </div>;
}
