import { z } from 'zod';
export const legalQuerySchema=z.object({input:z.string().trim().min(1,'Describe what happened.').max(4000),language:z.enum(['en','hi','hinglish']).default('en')});
export const uploadMetadataSchema=z.object({name:z.string().trim().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/),type:z.enum(['application/pdf','image/jpeg','image/png']),size:z.number().int().positive().max(10*1024*1024)});
