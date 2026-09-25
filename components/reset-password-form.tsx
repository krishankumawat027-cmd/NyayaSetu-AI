'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    if (password.length < 8) { setMessage('Use at least 8 characters.'); return; }
    if (password !== confirmation) { setMessage('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { error } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (error) throw error;
      router.replace('/dashboard'); router.refresh();
    } catch { setMessage('Password could not be updated. Request a new reset link and try again.'); }
    finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
    <label className="block text-xs font-semibold" htmlFor="new-password">New password<input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring mt-2 min-h-11 w-full rounded border border-slate-200 px-3 text-sm"/></label>
    <label className="block text-xs font-semibold" htmlFor="confirm-new-password">Confirm new password<input id="confirm-new-password" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="focus-ring mt-2 min-h-11 w-full rounded border border-slate-200 px-3 text-sm"/></label>
    {message && <p role="alert" className="text-sm text-rose-700">{message}</p>}
    <button disabled={loading} className="min-h-11 w-full rounded bg-teal px-4 text-sm font-bold text-white disabled:opacity-60">{loading ? 'Updating password…' : 'Update password'}</button>
  </form>;
}
