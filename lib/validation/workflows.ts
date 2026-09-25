import { z } from 'zod';

export const supportedLanguageSchema = z.enum(['en', 'hi', 'hinglish']);
export const roadmapCreateSchema = z.object({
  input: z.string().trim().min(1).max(4000),
  language: supportedLanguageSchema.default('en'),
  title: z.string().trim().max(120).optional(),
});
export const legalTermSchema = z.object({ term: z.string().trim().min(1).max(120), language: supportedLanguageSchema.default('en') });
export const documentAnalysisRequestSchema = z.object({ consent: z.literal(true) });
export const uuidSchema = z.string().uuid();
export const roadmapStepUpdateSchema = z.object({ stepId: uuidSchema, completed: z.boolean() });
export const evidenceUpdateSchema = z.object({ itemId: uuidSchema, completed: z.boolean() });
export const evidenceCreateSchema = z.object({ label: z.string().trim().min(1).max(180) });
export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2).max(100).optional(),
  preferred_language: supportedLanguageSchema.optional(),
}).refine((profile) => profile.full_name !== undefined || profile.preferred_language !== undefined);
