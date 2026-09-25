import { NextResponse } from 'next/server';
import { readBoundedRequest, requireAuthenticatedUser } from '@/lib/security/api';
import { evidenceCreateSchema, evidenceUpdateSchema, uuidSchema } from '@/lib/validation/workflows';

type RouteContext = { params: Promise<{ roadmapId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to update evidence.' }, { status: 401 });
    const { roadmapId } = await context.params;
    if (!uuidSchema.safeParse(roadmapId).success) return NextResponse.json({ error: 'Roadmap not found.' }, { status: 404 });
    const bounded = await readBoundedRequest(request, 2048);
    if ('response' in bounded) return bounded.response;
    const parsed = evidenceCreateSchema.safeParse(await bounded.request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter an evidence item up to 180 characters.' }, { status: 400 });
    const { data, error } = await auth.supabase.from('evidence_items').insert({ user_id: auth.user.id, roadmap_id: roadmapId, label: parsed.data.label }).select('id,roadmap_id,label,completed').single();
    if (error) return NextResponse.json({ error: 'Roadmap not found or evidence could not be added.' }, { status: 404 });
    return NextResponse.json({ item: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Evidence could not be added.' }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to update evidence.' }, { status: 401 });
    const { roadmapId } = await context.params;
    if (!uuidSchema.safeParse(roadmapId).success) return NextResponse.json({ error: 'Roadmap not found.' }, { status: 404 });
    const bounded = await readBoundedRequest(request, 2048);
    if ('response' in bounded) return bounded.response;
    const parsed = evidenceUpdateSchema.safeParse(await bounded.request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid evidence item.' }, { status: 400 });
    const { data, error } = await auth.supabase.from('evidence_items').update({ completed: parsed.data.completed })
      .eq('id', parsed.data.itemId).eq('roadmap_id', roadmapId).eq('user_id', auth.user.id)
      .select('id,roadmap_id,label,completed').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Evidence item not found.' }, { status: 404 });
    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: 'Evidence could not be updated.' }, { status: 503 });
  }
}
