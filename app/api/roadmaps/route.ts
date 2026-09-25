import { NextResponse } from 'next/server';
import { enforceRequestRateLimit, readBoundedRequest, requireAuthenticatedUser } from '@/lib/security/api';
import { roadmapCreateSchema } from '@/lib/validation/workflows';
import { answerLegalQuery } from '@/lib/ai/gemini';
import { getTrustedResources, retrieveTrustedSources } from '@/lib/retrieval/sources';
export const maxDuration = 60;

function redactDirectIdentifiers(input: string) {
  return input.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]').replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[phone]');
}

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to view roadmaps.' }, { status: 401 });
    const { data: roadmaps, error } = await auth.supabase.from('roadmaps')
      .select('id,title,category,progress,created_at,query_id,resources,summary')
      .eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    const ids = (roadmaps ?? []).map((roadmap) => roadmap.id);
    const [stepsResult, evidenceResult] = ids.length ? await Promise.all([
      auth.supabase.from('roadmap_steps').select('id,roadmap_id,position,title,body,completed').eq('user_id', auth.user.id).in('roadmap_id', ids).order('position'),
      auth.supabase.from('evidence_items').select('id,roadmap_id,label,completed').eq('user_id', auth.user.id).in('roadmap_id', ids).order('created_at'),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    if (stepsResult.error || evidenceResult.error) throw stepsResult.error ?? evidenceResult.error;
    const trustedResources = new Map(getTrustedResources().map((resource) => [resource.id, resource]));
    return NextResponse.json({ roadmaps: (roadmaps ?? []).map((roadmap) => ({
      ...roadmap,
      resources: Array.isArray(roadmap.resources) ? roadmap.resources.flatMap((resource: { id?: string }) => {
        const trusted = trustedResources.get(resource.id ?? '');
        return trusted ? [{ id: trusted.id, name: trusted.name, organization: trusted.organization, url: trusted.url, reference: trusted.reference }] : [];
      }) : [],
      steps: (stepsResult.data ?? []).filter((step) => step.roadmap_id === roadmap.id),
      evidence: (evidenceResult.data ?? []).filter((item) => item.roadmap_id === roadmap.id),
    })) });
  } catch {
    return NextResponse.json({ error: 'Roadmaps could not be loaded. Please try again.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to create a roadmap.' }, { status: 401 });
    if (enforceRequestRateLimit(`roadmaps:${auth.user.id}`)) return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    const bounded = await readBoundedRequest(request, 16_384);
    if ('response' in bounded) return bounded.response;
    const parsed = roadmapCreateSchema.safeParse(await bounded.request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a situation using no more than 4,000 characters.' }, { status: 400 });

    const { input, language, title } = parsed.data;
    const sources = retrieveTrustedSources(input);
    const answer = await answerLegalQuery(input, language, sources);
    const { data: query, error: queryError } = await auth.supabase.from('legal_queries').insert({
      user_id: auth.user.id,
      input_redacted: redactDirectIdentifiers(input),
      language,
    }).select('id').single();
    if (queryError) throw queryError;

    const { data: roadmap, error: roadmapError } = await auth.supabase.from('roadmaps').insert({
      user_id: auth.user.id,
      query_id: query.id,
      title: title || redactDirectIdentifiers(answer.summary).slice(0, 120),
      category: answer.category,
      resources: sources.map(({ id, name, organization, description, category, url }) => ({ id, name, organization, description, category, url })),
      summary: {
        problem: redactDirectIdentifiers(answer.summary),
        relevantInformation: redactDirectIdentifiers(answer.generalInformation),
        importantFacts: answer.importantFacts.map(redactDirectIdentifiers),
        cautions: answer.cautions.map(redactDirectIdentifiers),
        professionalHelp: redactDirectIdentifiers(answer.professionalHelp),
      },
    }).select('id,title,category,progress,created_at,query_id,resources,summary').single();
    if (roadmapError) {
      await auth.supabase.from('legal_queries').delete().eq('id', query.id).eq('user_id', auth.user.id);
      throw roadmapError;
    }

    const steps = answer.nextSteps.map((body, position) => ({
      user_id: auth.user.id,
      roadmap_id: roadmap.id,
      position: position + 1,
      title: redactDirectIdentifiers(body).length > 80 ? `${redactDirectIdentifiers(body).slice(0, 77)}…` : redactDirectIdentifiers(body),
      body: redactDirectIdentifiers(body),
    }));
    const evidence = answer.evidence.map((label) => ({ user_id: auth.user.id, roadmap_id: roadmap.id, label }));
    const [stepsResult, evidenceResult] = await Promise.all([
      steps.length ? auth.supabase.from('roadmap_steps').insert(steps).select('id,roadmap_id,position,title,body,completed') : Promise.resolve({ data: [], error: null }),
      evidence.length ? auth.supabase.from('evidence_items').insert(evidence).select('id,roadmap_id,label,completed') : Promise.resolve({ data: [], error: null }),
    ]);
    if (stepsResult.error || evidenceResult.error) {
      await auth.supabase.from('roadmaps').delete().eq('id', roadmap.id).eq('user_id', auth.user.id);
      await auth.supabase.from('legal_queries').delete().eq('id', query.id).eq('user_id', auth.user.id);
      throw new Error('The roadmap could not be saved.');
    }
    return NextResponse.json({ roadmap: { ...roadmap, steps: stepsResult.data ?? [], evidence: evidenceResult.data ?? [] } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'The roadmap could not be created. The assistant may be unavailable; please retry.' }, { status: 503 });
  }
}
