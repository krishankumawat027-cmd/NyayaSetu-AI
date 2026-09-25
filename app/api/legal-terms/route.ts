import { NextResponse } from 'next/server';
import { enforceRequestRateLimit, readBoundedRequest, requireAuthenticatedUser } from '@/lib/security/api';
import { legalTermSchema } from '@/lib/validation/workflows';
import { explainLegalTerm } from '@/lib/ai/gemini';
import { retrieveTrustedSources } from '@/lib/retrieval/sources';
export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to use the legal term explainer.' }, { status: 401 });
    if (enforceRequestRateLimit(`terms:${auth.user.id}`)) return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    const bounded = await readBoundedRequest(request, 4096);
    if ('response' in bounded) return bounded.response;
    const parsed = legalTermSchema.safeParse(await bounded.request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter a legal term up to 120 characters.' }, { status: 400 });
    const sources = retrieveTrustedSources(parsed.data.term);
    const explanation = await explainLegalTerm(parsed.data.term, parsed.data.language, sources);
    return NextResponse.json({ explanation });
  } catch {
    return NextResponse.json({ error: 'The legal term service is unavailable. Please retry.' }, { status: 503 });
  }
}
