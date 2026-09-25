import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicSupabaseEnv } from '@/lib/env';

const protectedPaths = ['/dashboard', '/assistant', '/documents', '/roadmaps', '/resources', '/profile'];

export async function proxy(request: NextRequest) {
  const isProtected = protectedPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (!isProtected) return NextResponse.next();
  let response = NextResponse.next({ request });
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseEnv();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => { cookies.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  if (!user.email_confirmed_at) return NextResponse.redirect(new URL('/login?error=verify-email', request.url));
  return response;
}

export const config = { matcher: ['/dashboard/:path*', '/assistant/:path*', '/documents/:path*', '/roadmaps/:path*', '/resources/:path*', '/profile/:path*'] };
