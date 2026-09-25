'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const credentialsSchema = z.object({ email: z.string().trim().email('Enter a valid email address.'), password: z.string().min(8, 'Use at least 8 characters.') });
type Credentials = z.infer<typeof credentialsSchema>;
const registerSchema = credentialsSchema.extend({ fullName: z.string().trim().min(2, 'Enter your name.').max(100, 'Use 100 characters or fewer.'), confirmPassword: z.string().min(1, 'Confirm your password.'), terms: z.literal(true, { error: 'Accept the Terms and Privacy Policy to continue.' }) }).refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });
type RegisterValues = z.infer<typeof registerSchema>;

function friendlyError(message: string) { if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect.'; if (/email not confirmed/i.test(message)) return 'Please verify your email before signing in.'; if (/user already registered/i.test(message)) return 'This email is already registered. Try signing in.'; if (/rate limit/i.test(message)) return 'Too many attempts. Please wait a moment and try again.'; return 'Authentication could not be completed. Please try again.'; }

export function AuthForm() {
  const router = useRouter(); const searchParams = useSearchParams(); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(searchParams.get('error') === 'verify-email' ? 'Verify your email before accessing your dashboard.' : '');
  const { register, handleSubmit, formState: { errors } } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema) });
  async function submit(values: Credentials) {
    setLoading(true); setMessage('');
    try {
      const { error } = await createSupabaseBrowserClient().auth.signInWithPassword(values);
      if (error) { setMessage(friendlyError(error.message)); return; }
      router.replace('/dashboard'); router.refresh();
    } catch { setMessage('Authentication could not be completed. Please try again.'); }
    finally { setLoading(false); }
  }
  async function resetPassword() {
    const email = document.querySelector<HTMLInputElement>('#login-email')?.value.trim();
    if (!email || !z.string().email().safeParse(email).success) { setMessage('Enter your email first, then choose Forgot password.'); return; }
    setLoading(true); setMessage('');
    try {
      const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
      setMessage(error ? friendlyError(error.message) : 'If an account exists for that email, reset instructions have been sent.');
    } catch { setMessage('Password reset could not be started. Please try again.'); }
    finally { setLoading(false); }
  }
  return <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate><label className="block"><span className="mb-2 block text-xs font-bold">Email</span><input id="login-email" {...register('email')} type="email" autoComplete="email" className="focus-ring w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm"/>{errors.email && <span className="mt-1 block text-[10px] text-rose-600">{errors.email.message}</span>}</label><label className="block"><span className="mb-2 block text-xs font-bold">Password</span><input {...register('password')} type="password" autoComplete="current-password" className="focus-ring w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm"/>{errors.password && <span className="mt-1 block text-[10px] text-rose-600">{errors.password.message}</span>}</label><button type="button" onClick={resetPassword} disabled={loading} className="text-left text-xs font-bold text-teal disabled:opacity-60">Forgot password?</button><button disabled={loading} className="w-full rounded-md bg-teal py-3 text-xs font-bold text-white disabled:opacity-60">{loading ? 'Signing in…' : 'Login'}</button>{message && <p className="text-xs text-teal" role="status">{message}</p>}</form>;
}

export function RegisterForm() {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  async function submit(values: RegisterValues) {
    setLoading(true); setMessage('');
    try {
      const { data, error } = await createSupabaseBrowserClient().auth.signUp({ email: values.email, password: values.password, options: { data: { full_name: values.fullName }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` } });
      if (error) { setMessage(friendlyError(error.message)); return; }
      if (!data.session) { setMessage('Account created. Check your email to verify your account before signing in.'); return; }
      router.replace('/dashboard'); router.refresh();
    } catch { setMessage('Account creation could not be completed. Please try again.'); }
    finally { setLoading(false); }
  }
  return <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate><label className="block"><span className="mb-2 block text-xs font-bold">Full name</span><input {...register('fullName')} autoComplete="name" className="focus-ring w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm"/>{errors.fullName && <span className="mt-1 block text-[10px] text-rose-600">{errors.fullName.message}</span>}</label><label className="block"><span className="mb-2 block text-xs font-bold">Email</span><input {...register('email')} type="email" autoComplete="email" className="focus-ring w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm"/>{errors.email && <span className="mt-1 block text-[10px] text-rose-600">{errors.email.message}</span>}</label><label className="block"><span className="mb-2 block text-xs font-bold">Password</span><input {...register('password')} type="password" autoComplete="new-password" className="focus-ring w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm"/><span className="mt-1 block text-[10px] text-slate-400">At least 8 characters.</span>{errors.password && <span className="mt-1 block text-[10px] text-rose-600">{errors.password.message}</span>}</label><label className="block"><span className="mb-2 block text-xs font-bold">Confirm password</span><input {...register('confirmPassword')} type="password" autoComplete="new-password" className="focus-ring w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm"/>{errors.confirmPassword && <span className="mt-1 block text-[10px] text-rose-600">{errors.confirmPassword.message}</span>}</label><label className="flex gap-2 text-xs text-slate-500"><input {...register('terms')} type="checkbox" className="accent-teal"/> <span>I agree to the Terms and Privacy Policy.</span></label>{errors.terms && <span className="block text-[10px] text-rose-600">{errors.terms.message}</span>}<button disabled={loading} className="w-full rounded-md bg-teal py-3 text-xs font-bold text-white disabled:opacity-60">{loading ? 'Creating account…' : 'Create Account'}</button>{message && <p className="text-xs text-teal" role="status">{message}</p>}</form>;
}
