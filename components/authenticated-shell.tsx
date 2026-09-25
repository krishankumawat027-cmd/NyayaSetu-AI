import { getProfileSettings } from '@/lib/auth/profile';
import { DashboardShell } from '@/components/dashboard-shell';
import { Disclaimer } from '@/components/disclaimer';

export async function AuthenticatedShell({ children, userName: providedUserName, preferredLanguage: providedLanguage }: { children: React.ReactNode; userName?: string; preferredLanguage?: 'en' | 'hi' | 'hinglish' }) {
  const profile = providedUserName && providedLanguage ? null : await getProfileSettings();
  const userName = providedUserName ?? profile!.name;
  const preferredLanguage = providedLanguage ?? profile!.preferredLanguage;
  return <DashboardShell userName={userName} preferredLanguage={preferredLanguage}><div className="mx-auto mt-5 max-w-7xl px-5 md:px-10"><Disclaimer /></div>{children}</DashboardShell>;
}
