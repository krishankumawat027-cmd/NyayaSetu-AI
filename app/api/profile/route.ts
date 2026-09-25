import { NextResponse } from 'next/server';
import { readBoundedRequest, requireAuthenticatedUser } from '@/lib/security/api';
import { profileUpdateSchema } from '@/lib/validation/workflows';
import { DEMO_DISPLAY_NAME } from '@/lib/auth/profile';

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to view your profile.' }, { status: 401 });
    const { data, error } = await auth.supabase.from('profiles').select('full_name,preferred_language,created_at').eq('id', auth.user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ profile: {
      name: data?.full_name?.trim() || DEMO_DISPLAY_NAME,
      email: auth.user.email ?? null,
      createdAt: data?.created_at ?? auth.user.created_at,
      preferredLanguage: data?.preferred_language ?? 'en',
    } });
  } catch {
    return NextResponse.json({ error: 'Profile could not be loaded.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to update your profile.' }, { status: 401 });
    const bounded = await readBoundedRequest(request, 2048);
    if ('response' in bounded) return bounded.response;
    const parsed = profileUpdateSchema.safeParse(await bounded.request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a valid name and language preference.' }, { status: 400 });
    const { data: existing, error: readError } = await auth.supabase.from('profiles').select('id').eq('id', auth.user.id).maybeSingle();
    if (readError) throw readError;
    const updates = {
      ...(parsed.data.full_name !== undefined ? { full_name: parsed.data.full_name } : {}),
      ...(parsed.data.preferred_language !== undefined ? { preferred_language: parsed.data.preferred_language } : {}),
    };
    const query = existing
      ? auth.supabase.from('profiles').update(updates).eq('id', auth.user.id)
      : auth.supabase.from('profiles').insert({ id: auth.user.id, full_name: typeof auth.user.user_metadata.full_name === 'string' ? auth.user.user_metadata.full_name.slice(0, 100) : null, preferred_language: 'en', ...updates });
    const { data, error } = await query.select('full_name,preferred_language').single();
    if (error) throw error;
    return NextResponse.json({ profile: { name: data.full_name, preferredLanguage: data.preferred_language } });
  } catch {
    return NextResponse.json({ error: 'Profile could not be updated.' }, { status: 503 });
  }
}
