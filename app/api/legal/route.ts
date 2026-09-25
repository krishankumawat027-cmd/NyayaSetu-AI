import { NextResponse } from 'next/server';
import { legalQuerySchema } from '@/lib/validation/legal';
import { retrieveTrustedSources } from '@/lib/retrieval/sources';
import { answerLegalQuery } from '@/lib/ai/gemini';
import { enforceRequestRateLimit, readBoundedRequest, requireAuthenticatedUser } from '@/lib/security/api';
export const maxDuration = 60;
export async function POST(request:Request){
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({error:'Sign in to use the legal assistant.'},{status:401});
    if (enforceRequestRateLimit(`legal:${auth.user.id}`)) return NextResponse.json({error:'Too many requests. Please wait a minute and try again.'},{status:429});
    const bounded = await readBoundedRequest(request, 16_384);
    if ('response' in bounded) return bounded.response;
    if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return NextResponse.json({error:'Send a JSON request.'},{status:415});
    const body: unknown = await bounded.request.json();
    const parsed=legalQuerySchema.safeParse(body);
    if(!parsed.success)return NextResponse.json({error:'Please describe your situation using no more than 4,000 characters.'},{status:400});
    const sources=retrieveTrustedSources(parsed.data.input);
    const answer=await answerLegalQuery(parsed.data.input,parsed.data.language,sources);
    return NextResponse.json({answer,sources});
  } catch {
    return NextResponse.json({error:'The legal information service is temporarily unavailable. Please try again.'},{status:503});
  }
}
