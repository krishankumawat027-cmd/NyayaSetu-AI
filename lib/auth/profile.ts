import { createSupabaseServerClient } from '@/lib/supabase/server';

export const DEMO_DISPLAY_NAME = 'Arjun';
export type PreferredLanguage = 'en' | 'hi' | 'hinglish';
export type ProfileSettings = { id: string | null; name: string; email: string | null; preferredLanguage: PreferredLanguage };

export async function getProfileSettings(): Promise<ProfileSettings> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, name: DEMO_DISPLAY_NAME, email: null, preferredLanguage: 'en' };
    const { data } = await supabase.from('profiles').select('full_name,preferred_language').eq('id', user.id).maybeSingle();
    const preferredLanguage = data?.preferred_language;
    return {
      id: user.id,
      name: data?.full_name?.trim() || DEMO_DISPLAY_NAME,
      email: user.email ?? null,
      preferredLanguage: preferredLanguage === 'hi' || preferredLanguage === 'hinglish' ? preferredLanguage : 'en',
    };
  } catch {
    return { id: null, name: DEMO_DISPLAY_NAME, email: null, preferredLanguage: 'en' };
  }
}

export async function getDisplayName() {
  return (await getProfileSettings()).name;
}
