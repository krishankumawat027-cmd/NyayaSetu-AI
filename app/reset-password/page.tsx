import Link from 'next/link';
import { ResetPasswordForm } from '@/components/reset-password-form';

export default function ResetPasswordPage() {
  return <main className="mx-auto max-w-lg px-5 py-16"><Link href="/login" className="text-xs font-bold text-teal">← Back to login</Link><h1 className="serif mt-12 text-4xl text-navy">Choose a new password</h1><p className="mt-3 text-sm leading-6 text-slate-500">Open this page from the password reset link sent to your email.</p><ResetPasswordForm/></main>;
}
