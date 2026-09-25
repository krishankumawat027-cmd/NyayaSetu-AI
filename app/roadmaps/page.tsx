import { AuthenticatedShell } from '@/components/authenticated-shell';
import { RoadmapWorkspace } from '@/components/roadmap-workspace';
import { getProfileSettings } from '@/lib/auth/profile';

export default async function RoadmapsPage() {
  const profile = await getProfileSettings();
  return <AuthenticatedShell userName={profile.name} preferredLanguage={profile.preferredLanguage}><div className="mx-auto max-w-5xl space-y-8 p-5 md:p-10">
    <div><p className="eyebrow">LEGAL ACTION ROADMAPS</p><h1 className="serif mt-2 text-5xl text-navy">Plan possible next steps.</h1><p className="mt-3 text-sm text-slate-500">Generate, save, and update situation-specific roadmaps and evidence checklists.</p></div>
    <RoadmapWorkspace initialLanguage={profile.preferredLanguage} />
  </div></AuthenticatedShell>;
}
