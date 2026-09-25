import { AuthenticatedShell } from '@/components/authenticated-shell';
import { DashboardHome } from '@/components/dashboard-home';
import { getProfileSettings } from '@/lib/auth/profile';
export default async function DashboardPage(){const profile = await getProfileSettings(); return <AuthenticatedShell userName={profile.name} preferredLanguage={profile.preferredLanguage}><DashboardHome userName={profile.name}/></AuthenticatedShell>}
