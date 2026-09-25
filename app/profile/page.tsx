import Link from 'next/link';
import { AuthenticatedShell } from '@/components/authenticated-shell';
import { ProfileManager } from '@/components/profile-manager';
import { getProfileSettings } from '@/lib/auth/profile';

export default async function ProfilePage() {
  const profile = await getProfileSettings();
  return <AuthenticatedShell userName={profile.name} preferredLanguage={profile.preferredLanguage}><div className="mx-auto max-w-4xl space-y-8 p-5 md:p-10">
    <div><p className="eyebrow">PROFILE & PRIVACY</p><h1 className="serif mt-2 text-5xl text-navy">Your account space.</h1><p className="mt-3 text-sm text-slate-500">Update your display name and preferred assistant language.</p></div>
    <ProfileManager />
    <nav aria-label="More workspace tools" className="card flex flex-wrap gap-4 p-5 text-sm"><Link className="text-teal underline" href="/resources">Official resources</Link><Link className="text-teal underline" href="/assistant#legal-term">Legal term explainer</Link><Link className="text-teal underline" href="/roadmaps">My roadmaps</Link><Link className="text-teal underline" href="/documents">My documents</Link></nav>
  </div></AuthenticatedShell>;
}
