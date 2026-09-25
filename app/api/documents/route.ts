import { NextResponse } from 'next/server';
import { enforceRequestRateLimit, readBoundedRequest, requireAuthenticatedUser } from '@/lib/security/api';
import { MAX_UPLOAD_BYTES, safeStoragePath } from '@/lib/security/upload';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to view your documents.' }, { status: 401 });
    const { data: documents, error } = await auth.supabase.from('documents')
      .select('id,original_name,mime_type,size_bytes,created_at')
      .eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    const ids = (documents ?? []).map((document) => document.id);
    const { data: analyses, error: analysisError } = ids.length
      ? await auth.supabase.from('document_analyses').select('id,document_id,status,summary,error_code,created_at').eq('user_id', auth.user.id).in('document_id', ids).order('created_at', { ascending: false })
      : { data: [], error: null };
    if (analysisError) throw analysisError;
    return NextResponse.json({ documents: (documents ?? []).map((document) => ({ ...document, analysis: (analyses ?? []).find((analysis) => analysis.document_id === document.id) ?? null })) });
  } catch {
    return NextResponse.json({ error: 'Documents could not be loaded.' }, { status: 503 });
  }
}

function hasExpectedSignature(type: string, bytes: Uint8Array) {
  if (type === 'application/pdf') return bytes.length >= 5 && String.fromCharCode(...bytes.subarray(0, 5)) === '%PDF-';
  if (type === 'image/png') return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return false;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to upload documents.' }, { status: 401 });
    if (enforceRequestRateLimit(`documents:${auth.user.id}`)) return NextResponse.json({ error: 'Too many uploads. Please wait a minute and try again.' }, { status: 429 });
    const bounded = await readBoundedRequest(request, MAX_UPLOAD_BYTES + 64 * 1024);
    if ('response' in bounded) return bounded.response;
    if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'Upload a document using a multipart form.' }, { status: 415 });
    }

    const form = await bounded.request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Choose a non-empty PDF, JPEG, or PNG under 10 MB.' }, { status: 400 });
    }
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png']);
    const name = file.name.trim();
    const extensionMatches = file.type === 'application/pdf' ? /\.pdf$/i.test(name)
      : file.type === 'image/png' ? /\.png$/i.test(name)
        : file.type === 'image/jpeg' ? /\.jpe?g$/i.test(name) : false;
    if (!allowed.has(file.type) || !extensionMatches || !/^[a-zA-Z0-9._-]{1,255}$/.test(name) || name === '.' || name === '..') {
      return NextResponse.json({ error: 'This document type or file name is not supported.' }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasExpectedSignature(file.type, bytes)) return NextResponse.json({ error: 'The file contents do not match the selected document type.' }, { status: 400 });

    const path = safeStoragePath(auth.user.id, name);
    const { error: uploadError } = await auth.supabase.storage.from('legal-documents').upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: 'The document could not be stored securely. Please try again.' }, { status: 503 });

    const { data, error } = await auth.supabase.from('documents').insert({
      user_id: auth.user.id,
      storage_path: path,
      original_name: name,
      mime_type: file.type,
      size_bytes: file.size,
    }).select('id').single();
    if (error) {
      await auth.supabase.storage.from('legal-documents').remove([path]);
      return NextResponse.json({ error: 'The document could not be saved. Please try again.' }, { status: 503 });
    }
    return NextResponse.json({ documentId: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'The document could not be uploaded. Please check the file and try again.' }, { status: 400 });
  }
}
