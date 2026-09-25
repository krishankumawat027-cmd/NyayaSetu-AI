import { NextResponse } from 'next/server';
import { readBoundedRequest, requireAuthenticatedUser } from '@/lib/security/api';
import { roadmapStepUpdateSchema, uuidSchema } from '@/lib/validation/workflows';

type RouteContext = { params: Promise<{ roadmapId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to update roadmaps.' }, { status: 401 });
    const { roadmapId } = await context.params;
    if (!uuidSchema.safeParse(roadmapId).success) return NextResponse.json({ error: 'Roadmap not found.' }, { status: 404 });
    const bounded = await readBoundedRequest(request, 2048);
    if ('response' in bounded) return bounded.response;
    const parsed = roadmapStepUpdateSchema.safeParse(await bounded.request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid roadmap step.' }, { status: 400 });

    const { data: step, error } = await auth.supabase.from('roadmap_steps').update({ completed: parsed.data.completed })
      .eq('id', parsed.data.stepId).eq('roadmap_id', roadmapId).eq('user_id', auth.user.id)
      .select('id,roadmap_id,position,title,body,completed').maybeSingle();
    if (error) throw error;
    if (!step) return NextResponse.json({ error: 'Roadmap step not found.' }, { status: 404 });

    const [{ count: total, error: totalError }, { count: completed, error: completedError }] = await Promise.all([
      auth.supabase.from('roadmap_steps').select('id', { count: 'exact', head: true }).eq('roadmap_id', roadmapId).eq('user_id', auth.user.id),
      auth.supabase.from('roadmap_steps').select('id', { count: 'exact', head: true }).eq('roadmap_id', roadmapId).eq('user_id', auth.user.id).eq('completed', true),
    ]);
    if (totalError || completedError) throw totalError ?? completedError;
    const progress = total ? Math.round((completed ?? 0) * 100 / total) : 0;
    const { error: progressError } = await auth.supabase.from('roadmaps').update({ progress }).eq('id', roadmapId).eq('user_id', auth.user.id);
    if (progressError) throw progressError;
    return NextResponse.json({ step, progress });
  } catch {
    return NextResponse.json({ error: 'The roadmap step could not be updated.' }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to delete roadmaps.' }, { status: 401 });
    const { roadmapId } = await context.params;
    if (!uuidSchema.safeParse(roadmapId).success) return NextResponse.json({ error: 'Roadmap not found.' }, { status: 404 });
    const { data, error } = await auth.supabase.from('roadmaps').delete().eq('id', roadmapId).eq('user_id', auth.user.id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Roadmap not found.' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: 'The roadmap could not be deleted.' }, { status: 503 });
  }
}
