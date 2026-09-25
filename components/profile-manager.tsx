'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Profile = { name: string; email: string | null; createdAt: string; preferredLanguage: 'en' | 'hi' | 'hinglish' };

export function ProfileManager() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<Profile['preferredLanguage']>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/profile').then(async (response) => {
      const result = await response.json() as { profile?: Profile; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error ?? 'Profile could not be loaded.');
      if (active) { setProfile(result.profile); setName(result.profile.name); setLanguage(result.profile.preferredLanguage); }
    }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : 'Profile could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ full_name: name, preferred_language: language }) });
      const result = await response.json() as { profile?: { name: string; preferredLanguage: Profile['preferredLanguage'] }; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error ?? 'Profile could not be saved.');
      setProfile((current) => current ? { ...current, name: result.profile!.name, preferredLanguage: result.profile!.preferredLanguage } : current);
      window.dispatchEvent(new CustomEvent('nyaya-language-change', { detail: result.profile.preferredLanguage }));
      setMessage('Profile updated.');
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Profile could not be saved.'); }
    finally { setSaving(false); }
  }

  if (loading) return <p role="status" className="text-sm text-slate-500">Loading profile…</p>;
  if (!profile) return <p role="alert" className="text-sm text-rose-700">{message || 'Profile could not be loaded.'}</p>;

  return <div className="space-y-6">
    <section className="card p-5 sm:p-6"><h2 className="text-base font-bold">Account information</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Email</dt><dd className="mt-1 text-sm font-semibold">{profile.email ?? 'Unavailable'}</dd></div><div><dt className="text-xs text-slate-500">Account created</dt><dd className="mt-1 text-sm font-semibold">{new Date(profile.createdAt).toLocaleDateString()}</dd></div></dl></section>
    <section className="card p-5 sm:p-6"><h2 className="text-base font-bold">Profile preferences</h2><form onSubmit={save} className="mt-4 space-y-4"><label className="block text-xs font-semibold" htmlFor="profile-name">Display name<input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required className="focus-ring mt-2 min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm"/></label><label className="block text-xs font-semibold" htmlFor="profile-language">Preferred language<select id="profile-language" value={language} onChange={(event) => setLanguage(event.target.value as Profile['preferredLanguage'])} className="focus-ring mt-2 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="en">English</option><option value="hi">हिन्दी</option><option value="hinglish">Hinglish</option></select></label><button disabled={saving} className="min-h-11 rounded-md bg-teal px-5 text-xs font-bold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save profile'}</button><p role="status" aria-live="polite" className="text-xs text-slate-600">{message}</p></form></section>
  </div>;
}
