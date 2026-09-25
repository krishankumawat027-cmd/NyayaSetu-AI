'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';

type Analysis = {
  meaning: string;
  partiesAndRoles: string[];
  importantDates: string[];
  paymentObligations: string[];
  responsibilities: string[];
  deadlinesAndNoticePeriods: string[];
  keyClauses: string[];
  terms: string[];
  thingsToCheck: string[];
  suggestedQuestions: string[];
  cautions: string[];
};
type DocumentRecord = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  analysis: { id: string; status: 'processing' | 'complete' | 'failed'; summary: Analysis | null; error_code: string | null; created_at: string } | null;
};

async function readError(response: Response) {
  const result = await response.json() as { error?: string };
  return result.error ?? 'The request could not be completed.';
}

export function DocumentUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [status, setStatus] = useState('PDF, JPEG or PNG · up to 10 MB. The service checks file content before private storage.');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [aiConsent, setAiConsent] = useState(false);
  const [error, setError] = useState('');

  async function loadDocuments() {
    const response = await fetch('/api/documents');
    const result = await response.json() as { documents?: DocumentRecord[]; error?: string };
    if (!response.ok) throw new Error(result.error ?? 'Documents could not be loaded.');
    setDocuments(result.documents ?? []);
  }

  useEffect(() => {
    let active = true;
    Promise.resolve().then(loadDocuments).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Documents could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusyId('upload'); setError(''); setStatus(`Uploading ${file.name}…`);
    try {
      const body = new FormData(); body.set('file', file);
      const response = await fetch('/api/documents', { method: 'POST', body });
      if (!response.ok) throw new Error(await readError(response));
      setStatus(`${file.name} was uploaded to your private documents.`);
      await loadDocuments();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The upload could not be completed.'); }
    finally { setBusyId(''); event.target.value = ''; }
  }

  async function analyze(document: DocumentRecord) {
    setBusyId(document.id); setError('');
    try {
      const response = await fetch(`/api/documents/${document.id}/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ consent: aiConsent }) });
      if (!response.ok) throw new Error(await readError(response));
      await loadDocuments(); setExpandedId(document.id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Document analysis failed.'); await loadDocuments().catch(() => undefined); }
    finally { setBusyId(''); }
  }

  async function remove(document: DocumentRecord) {
    if (!window.confirm(`Delete “${document.original_name}” and its analysis?`)) return;
    setBusyId(document.id); setError('');
    try {
      const response = await fetch(`/api/documents/${document.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await readError(response));
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      if (expandedId === document.id) setExpandedId('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Document could not be deleted.'); }
    finally { setBusyId(''); }
  }

  const renderList = (title: string, items: string[]) => <section className="mt-4"><h4 className="text-xs font-bold">{title}</h4>{items.length ? <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="mt-1 text-sm text-slate-500">No information identified.</p>}</section>;

  return <div className="space-y-6">
    <div className="card border-dashed p-8 text-center sm:p-12"><Upload className="mx-auto text-teal" size={34} aria-hidden="true"/><h2 className="mt-4 text-lg font-bold">Upload a private document</h2><p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-500" role="status" aria-live="polite">{status}</p><label htmlFor="document-file" className="sr-only">Choose PDF, JPEG or PNG document</label><input ref={inputRef} id="document-file" onChange={upload} disabled={busyId === 'upload'} type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" className="sr-only"/><button type="button" onClick={() => inputRef.current?.click()} disabled={busyId === 'upload'} className="focus-ring mt-6 min-h-11 rounded-md bg-teal px-5 py-3 text-xs font-bold text-white disabled:opacity-60">{busyId === 'upload' ? 'Uploading…' : 'Choose document'}</button></div>
    {error && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">Document analysis sends the selected document contents to Google Gemini for processing. Only analyze documents you are authorized to share with that service. Files remain in your private Supabase storage.</p>
    <label className="flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} className="mt-1 h-5 w-5 accent-teal"/><span>I understand that analysis sends the document to Google Gemini.</span></label>
    <section className="space-y-3" aria-labelledby="my-documents-title"><h2 id="my-documents-title" className="text-lg font-bold">My documents</h2>{loading && <p role="status" className="text-sm text-slate-500">Loading your documents…</p>}{!loading && !documents.length && <p className="card p-5 text-sm text-slate-500">No documents uploaded yet.</p>}
      {documents.map((document) => <article className="card p-5" key={document.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="break-all text-sm font-bold">{document.original_name}</h3><p className="mt-1 text-xs text-slate-500">{document.mime_type} · {(document.size_bytes / 1024 / 1024).toFixed(2)} MB · Uploaded {new Date(document.created_at).toLocaleString()}</p><p className="mt-2 text-xs font-semibold">Analysis status: {document.analysis?.status ?? 'Not analyzed'}</p></div><div className="flex flex-wrap gap-2">{document.analysis?.status === 'complete' && <button type="button" onClick={() => setExpandedId(expandedId === document.id ? '' : document.id)} className="min-h-11 rounded border px-3 text-xs">{expandedId === document.id ? 'Hide analysis' : 'View analysis'}</button>}<button type="button" disabled={busyId === document.id || !aiConsent} onClick={() => analyze(document)} className="min-h-11 rounded bg-teal px-3 text-xs font-bold text-white disabled:opacity-60">{busyId === document.id ? 'Analyzing…' : document.analysis?.status === 'complete' ? 'Analyze again' : document.analysis?.status === 'processing' ? 'Restart analysis' : document.analysis?.status === 'failed' ? 'Retry analysis' : 'Analyze document'}</button><button type="button" disabled={busyId === document.id} onClick={() => remove(document)} className="min-h-11 rounded border border-rose-200 px-3 text-xs text-rose-700">Delete</button></div></div>
        {expandedId === document.id && document.analysis?.summary && <div className="mt-5 border-t border-slate-100 pt-4"><h4 className="text-base font-bold">What This Document Means</h4><p className="mt-2 text-sm leading-6 text-slate-600">{document.analysis.summary.meaning}</p>{renderList('Important Information · parties and roles', document.analysis.summary.partiesAndRoles)}{renderList('Important Dates', document.analysis.summary.importantDates)}{renderList('Payment Obligations', document.analysis.summary.paymentObligations)}{renderList('Responsibilities', document.analysis.summary.responsibilities)}{renderList('Deadlines and Notice Periods', document.analysis.summary.deadlinesAndNoticePeriods)}{renderList('Key Clauses', document.analysis.summary.keyClauses)}{renderList('Difficult Terms', document.analysis.summary.terms)}{renderList('Things To Check', document.analysis.summary.thingsToCheck)}{renderList('Suggested Questions / Next Steps', document.analysis.summary.suggestedQuestions)}{renderList('Cautions', document.analysis.summary.cautions)}</div>}
      </article>)}
    </section>
  </div>;
}
