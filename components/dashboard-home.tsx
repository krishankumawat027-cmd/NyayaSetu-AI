import Link from 'next/link';
import { ArrowRight, Brain, FileText, Map, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { QueryWorkspace } from './query-workspace';

type Action = { icon: LucideIcon; title: string; description: string; cta: string; href: '/assistant' | '/assistant#legal-term' | '/documents' | '/roadmaps' };
const actions: Action[] = [
  { icon: Sparkles, title: 'Ask NyayaSetu', description: 'Describe your legal situation.', cta: 'Start consultation', href: '/assistant' },
  { icon: FileText, title: 'Analyze document', description: 'Understand a document simply.', cta: 'Upload document', href: '/documents' },
  { icon: Map, title: 'Create roadmap', description: 'Turn a problem into next steps.', cta: 'Create roadmap', href: '/roadmaps' },
  { icon: Brain, title: 'Legal term', description: 'Understand difficult terminology.', cta: 'Explore terms', href: '/assistant#legal-term' },
];

export function DashboardHome({ userName }: { userName: string }) {
  return <div className="mx-auto max-w-7xl space-y-8 p-5 md:p-10">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow">YOUR WORKSPACE</p><h1 className="serif text-4xl text-navy md:text-5xl">Good morning, {userName} 👋</h1><p className="mt-2 text-sm text-slate-500">What would you like help understanding today?</p></div><span className="w-fit rounded-full bg-teal/10 px-3 py-2 text-xs font-bold text-teal">● AI assistant ready</span></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{actions.map(({ icon: Icon, title, description, cta, href }) => <Link href={href} key={title} className="card group p-5 transition hover:-translate-y-1"><span className="mb-5 grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal"><Icon size={18}/></span><h2 className="text-sm font-bold">{title}</h2><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{description}</p><span className="mt-5 block text-[10px] font-bold text-teal">{cta} <ArrowRight size={14} className="ml-1 inline"/></span></Link>)}</div>
    <QueryWorkspace/>
    <section className="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"><div><p className="eyebrow">YOUR SAVED WORK</p><h2 className="mt-1 text-lg font-bold">Continue a roadmap or build a new one.</h2><p className="mt-1 text-sm text-slate-500">Your saved steps and evidence progress stay with your account.</p></div><Link href="/roadmaps" className="inline-flex min-h-11 items-center rounded-md border border-slate-200 px-4 text-xs font-bold text-teal">Open roadmaps <ArrowRight size={14} className="ml-2"/></Link></section>
  </div>;
}
