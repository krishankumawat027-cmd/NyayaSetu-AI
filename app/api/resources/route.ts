import { NextResponse } from 'next/server';
import { getTrustedResources } from '@/lib/retrieval/sources';
import { readBoundedRequest, requireAuthenticatedUser } from '@/lib/security/api';
import { z } from 'zod';

const resourceIdSchema = z.object({ sourceId: z.string().min(1).max(80) });

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to view resources.' }, { status: 401 });
    const { data, error } = await auth.supabase.from('saved_resources').select('source_id').eq('user_id', auth.user.id);
    if (error) throw error;
    return NextResponse.json({ resources: getTrustedResources(), savedIds: (data ?? []).map((row) => row.source_id).filter(Boolean) });
  } catch {
    return NextResponse.json({ error: 'Resources could not be loaded.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to save resources.' }, { status: 401 });
    const bounded = await readBoundedRequest(request, 2048);
    if ('response' in bounded) return bounded.response;
    const parsed = resourceIdSchema.safeParse(await bounded.request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Select a listed resource.' }, { status: 400 });
    const source = getTrustedResources().find((resource) => resource.id === parsed.data.sourceId);
    if (!source) return NextResponse.json({ error: 'Select a listed resource.' }, { status: 400 });
    const { error } = await auth.supabase.from('saved_resources').upsert({
      user_id: auth.user.id, source_id: source.id, source_name: source.organization,
      title: source.name, url: source.url, organization: source.organization,
      description: source.description, category: source.category,
    }, { onConflict: 'user_id,source_id' });
    if (error) throw error;
    return NextResponse.json({ saved: true, sourceId: source.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'The resource could not be saved.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to remove saved resources.' }, { status: 401 });
    const bounded = await readBoundedRequest(request, 2048);
    if ('response' in bounded) return bounded.response;
    const parsed = resourceIdSchema.safeParse(await bounded.request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Select a listed resource.' }, { status: 400 });
    const { data, error } = await auth.supabase.from('saved_resources').delete().eq('user_id', auth.user.id).eq('source_id', parsed.data.sourceId).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Saved resource was not found.' }, { status: 404 });
    return NextResponse.json({ saved: false, sourceId: parsed.data.sourceId });
  } catch {
    return NextResponse.json({ error: 'Saved resource could not be removed.' }, { status: 503 });
  }
}
