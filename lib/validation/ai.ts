import { z } from 'zod';

const answerSourceSchema = z.object({ name: z.string(), reference: z.string(), lastChecked: z.string().optional() });

export const legalAnswerSchema = z.object({
  summary: z.string(),
  category: z.string(),
  importantFacts: z.array(z.string()),
  generalInformation: z.string(),
  nextSteps: z.array(z.string()),
  evidence: z.array(z.string()),
  cautions: z.array(z.string()),
  sources: z.array(answerSourceSchema),
  professionalHelp: z.string(),
});

export const legalTermExplanationSchema = z.object({
  term: z.string(),
  simpleDefinition: z.string(),
  hindiMeaning: z.string(),
  whyItMatters: z.string(),
  example: z.string(),
  verificationNote: z.string(),
});

export const legalDocumentAnalysisSchema = z.object({
  meaning: z.string(),
  partiesAndRoles: z.array(z.string()),
  importantDates: z.array(z.string()),
  paymentObligations: z.array(z.string()),
  responsibilities: z.array(z.string()),
  deadlinesAndNoticePeriods: z.array(z.string()),
  keyClauses: z.array(z.string()),
  terms: z.array(z.string()),
  thingsToCheck: z.array(z.string()),
  suggestedQuestions: z.array(z.string()),
  cautions: z.array(z.string()),
});

export type LegalAnswer = z.infer<typeof legalAnswerSchema>;
export type LegalTermExplanation = z.infer<typeof legalTermExplanationSchema>;
export type LegalDocumentAnalysis = z.infer<typeof legalDocumentAnalysisSchema>;
