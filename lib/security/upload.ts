import { uploadMetadataSchema } from '@/lib/validation/legal';
export const MAX_UPLOAD_BYTES=10*1024*1024;
export function validateUpload(metadata:unknown){const parsed=uploadMetadataSchema.safeParse(metadata);if(!parsed.success)throw new Error('Unsupported or oversized document.');return parsed.data}
export function safeStoragePath(userId:string, originalName:string){const safeName=originalName.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,80);return `${userId}/${crypto.randomUUID()}-${safeName}`}
