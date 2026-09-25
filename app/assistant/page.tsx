import { AuthenticatedShell } from '@/components/authenticated-shell';
import { QueryWorkspace } from '@/components/query-workspace';
import { LegalTermWorkspace } from '@/components/legal-term-workspace';

export default function AssistantPage() {
  return <AuthenticatedShell><div className="mx-auto max-w-5xl space-y-7 p-5 md:p-10">
    <div><p className="eyebrow">ASK NYAYASETU</p><h1 className="serif mt-2 text-5xl text-navy">Explain, verify and plan.</h1><p className="mt-3 text-sm text-slate-500">Describe the situation or search for a legal term in English, Hindi, or Hinglish.</p></div>
    <QueryWorkspace />
    <LegalTermWorkspace />
  </div></AuthenticatedShell>;
}
