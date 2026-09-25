import { NextResponse } from 'next/server';
import { analyzeLegalDocument } from '@/lib/ai/gemini';
import { requireAuthenticatedUser, enforceRequestRateLimit, readBoundedRequest } from '@/lib/security/api';
import { documentAnalysisRequestSchema, uuidSchema } from '@/lib/validation/workflows';
import { getProfileSettings } from '@/lib/auth/profile';

export const runtime = 'nodejs';
export const maxDuration = 60;
type RouteContext = { params: Promise<{ documentId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: 'Sign in to analyze documents.' }, { status: 401 });
  if (enforceRequestRateLimit(`document-analysis:${auth.user.id}`)) return NextResponse.json({ error: 'Too many analysis requests. Please wait a minute.' }, { status: 429 });
  const bounded = await readBoundedRequest(_request, 1024);
  if ('response' in bounded) return bounded.response;
  const requestConsent = documentAnalysisRequestSchema.safeParse(await bounded.request.json());
  if (!requestConsent.success) return NextResponse.json({ error: 'Confirm that the document may be sent to Google Gemini for analysis.' }, { status: 400 });
  const { documentId } = await context.params;
  if (!uuidSchema.safeParse(documentId).success) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  const { data: document, error: documentError } = await auth.supabase.from('documents')
    .select('id,storage_path,mime_type').eq('id', documentId).eq('user_id', auth.user.id).maybeSingle();
  if (documentError || !document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

  const { data: analysis, error: createError } = await auth.supabase.from('document_analyses').upsert({
    document_id: document.id, user_id: auth.user.id, status: 'processing', summary: null, error_code: null,
  }, { onConflict: 'document_id' }).select('id').single();
  if (createError) return NextResponse.json({ error: 'Analysis could not be started.' }, { status: 503 });

  try {
    const [{ data: file, error: downloadError }, profile] = await Promise.all([
      auth.supabase.storage.from('legal-documents').download(document.storage_path),
      getProfileSettings(),
    ]);
    if (downloadError || !file) throw new Error('The private document could not be retrieved.');
    const result = await analyzeLegalDocument(new Uint8Array(await file.arrayBuffer()), document.mime_type, profile.preferredLanguage);
    const { error: saveError } = await auth.supabase.from('document_analyses').update({ status: 'complete', summary: result, error_code: null })
      .eq('id', analysis.id).eq('user_id', auth.user.id);
    if (saveError) throw saveError;
    return NextResponse.json({ analysis: { id: analysis.id, document_id: document.id, status: 'complete', summary: result } });
  } catch {
    await auth.supabase.from('document_analyses').update({ status: 'failed', error_code: 'analysis_failed' }).eq('id', analysis.id).eq('user_id', auth.user.id);
    return NextResponse.json({ error: 'Analysis failed. Check that the file is readable and try again.' }, { status: 503 });
  }
}
