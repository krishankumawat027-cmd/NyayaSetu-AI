import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/security/api';
import { uuidSchema } from '@/lib/validation/workflows';

type RouteContext = { params: Promise<{ documentId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: 'Sign in to delete documents.' }, { status: 401 });
    const { documentId } = await context.params;
    if (!uuidSchema.safeParse(documentId).success) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    const { data: document, error: lookupError } = await auth.supabase.from('documents').select('id,storage_path')
      .eq('id', documentId).eq('user_id', auth.user.id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

    const { data: backup, error: downloadError } = await auth.supabase.storage.from('legal-documents').download(document.storage_path);
    if (downloadError || !backup) throw new Error('Document storage is unavailable.');
    const backupBytes = new Uint8Array(await backup.arrayBuffer());
    const { error: storageError } = await auth.supabase.storage.from('legal-documents').remove([document.storage_path]);
    if (storageError) throw new Error('Document could not be deleted.');
    const { error: deleteError } = await auth.supabase.from('documents').delete().eq('id', document.id).eq('user_id', auth.user.id);
    if (deleteError) {
      await auth.supabase.storage.from('legal-documents').upload(document.storage_path, backupBytes, { upsert: false });
      throw new Error('Document could not be deleted.');
    }
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: 'Document could not be deleted. Please try again.' }, { status: 503 });
  }
}
