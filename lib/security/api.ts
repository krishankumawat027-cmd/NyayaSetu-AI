import 'server-only';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const requests = new Map<string, { count: number; resetAt: number }>();

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return null;
  return { supabase, user };
}

export function enforceRequestRateLimit(key: string) {
  const now = Date.now();
  const bucket = requests.get(key);
  if (!bucket || bucket.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  if (requests.size > 10_000) {
    for (const [entry, value] of requests) if (value.resetAt <= now) requests.delete(entry);
  }
  return bucket.count > MAX_REQUESTS;
}

export function rejectLargeRequest(request: Request, maximumBytes: number) {
  const rawLength = request.headers.get('content-length');
  if (rawLength && Number(rawLength) > maximumBytes) {
    return NextResponse.json({ error: 'The request is too large.' }, { status: 413 });
  }
  return null;
}

export async function readBoundedRequest(request: Request, maximumBytes: number) {
  const oversized = rejectLargeRequest(request, maximumBytes);
  if (oversized) return { response: oversized } as const;
  if (!request.body) return { response: NextResponse.json({ error: 'A request body is required.' }, { status: 400 }) } as const;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        return { response: NextResponse.json({ error: 'The request is too large.' }, { status: 413 }) } as const;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const headers = new Headers(request.headers);
  headers.delete('content-length');
  return { request: new Request(request.url, { method: request.method, headers, body: bytes }) } as const;
}
