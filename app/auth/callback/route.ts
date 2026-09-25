import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedNext = url.searchParams.get('next') || '/dashboard';
  const candidate = new URL(requestedNext, url.origin);
  const next = candidate.origin === url.origin && requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? `${candidate.pathname}${candidate.search}${candidate.hash}`
    : '/dashboard';
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=verification-failed', url.origin));
}
