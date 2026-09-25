/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');

function loadTypeScript(relativePath) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loadedModule = new Module(filename, module);
  loadedModule.filename = filename;
  loadedModule.paths = Module._nodeModulePaths(path.dirname(filename));
  loadedModule._compile(compiled, filename);
  return loadedModule.exports;
}

const { legalQuerySchema, uploadMetadataSchema } = loadTypeScript('lib/validation/legal.ts');
const { roadmapCreateSchema, roadmapStepUpdateSchema, evidenceCreateSchema, profileUpdateSchema, legalTermSchema } = loadTypeScript('lib/validation/workflows.ts');
const { legalAnswerSchema, legalTermExplanationSchema, legalDocumentAnalysisSchema } = loadTypeScript('lib/validation/ai.ts');
const { getTrustedResources, retrieveTrustedSources } = loadTypeScript('lib/retrieval/sources.ts');

test('legal query trims input, defaults language and accepts all supported language modes', () => {
  assert.deepEqual(legalQuerySchema.parse({ input: '  Help  ' }), { input: 'Help', language: 'en' });
  for (const language of ['en', 'hi', 'hinglish']) {
    assert.equal(legalQuerySchema.safeParse({ input: 'Help', language }).success, true);
  }
});

test('legal query rejects empty and overlong content', () => {
  assert.equal(legalQuerySchema.safeParse({ input: '   ' }).success, false);
  assert.equal(legalQuerySchema.safeParse({ input: 'x'.repeat(4001) }).success, false);
  assert.equal(legalQuerySchema.safeParse({ input: 'x'.repeat(4000) }).success, true);
});

test('upload metadata accepts only supported types and bounded positive integer sizes', () => {
  const base = { name: 'order.pdf', type: 'application/pdf', size: 1024 };
  assert.equal(uploadMetadataSchema.safeParse(base).success, true);
  assert.equal(uploadMetadataSchema.safeParse({ ...base, type: 'text/html' }).success, false);
  assert.equal(uploadMetadataSchema.safeParse({ ...base, name: '../order.pdf' }).success, false);
  assert.equal(uploadMetadataSchema.safeParse({ ...base, size: 0 }).success, false);
  assert.equal(uploadMetadataSchema.safeParse({ ...base, size: 10 * 1024 * 1024 + 1 }).success, false);
  assert.equal(uploadMetadataSchema.safeParse({ ...base, size: 1.5 }).success, false);
});

test('roadmap and term inputs enforce bounded content and supported language choices', () => {
  assert.equal(roadmapCreateSchema.safeParse({ input: 'A seller did not deliver my order.', language: 'hinglish' }).success, true);
  assert.equal(roadmapCreateSchema.safeParse({ input: 'x'.repeat(4001) }).success, false);
  assert.equal(legalTermSchema.safeParse({ term: 'consideration', language: 'hi' }).success, true);
  assert.equal(legalTermSchema.safeParse({ term: 'x'.repeat(121) }).success, false);
});

test('profile and checklist mutations require valid owned-object identifiers and values', () => {
  assert.equal(profileUpdateSchema.safeParse({ preferred_language: 'hinglish' }).success, true);
  assert.equal(profileUpdateSchema.safeParse({}).success, false);
  assert.equal(evidenceCreateSchema.safeParse({ label: 'Order confirmation' }).success, true);
  assert.equal(evidenceCreateSchema.safeParse({ label: '' }).success, false);
  assert.equal(roadmapStepUpdateSchema.safeParse({ stepId: 'not-a-uuid', completed: true }).success, false);
});

test('AI responses must match the complete structured assistant, term, and document shapes', () => {
  const answer = { summary: 'Summary', category: 'Consumer issue', importantFacts: [], generalInformation: 'General information', nextSteps: ['Contact seller'], evidence: ['Order receipt'], cautions: ['Check current rules'], sources: [], professionalHelp: 'Get legal help when needed.' };
  assert.equal(legalAnswerSchema.safeParse(answer).success, true);
  assert.equal(legalAnswerSchema.safeParse({ ...answer, nextSteps: 'not an array' }).success, false);
  assert.equal(legalTermExplanationSchema.safeParse({ term: 'Offer', simpleDefinition: 'Meaning', hindiMeaning: 'अर्थ', whyItMatters: 'Context', example: 'Example', verificationNote: 'Verify' }).success, true);
  assert.equal(legalDocumentAnalysisSchema.safeParse({ meaning: 'Plain explanation', partiesAndRoles: [], importantDates: [], paymentObligations: [], responsibilities: [], deadlinesAndNoticePeriods: [], keyClauses: [], terms: [], thingsToCheck: [], suggestedQuestions: [], cautions: [] }).success, true);
});

test('resource catalogue and retrieval use only allow-listed official domains', () => {
  const resources = getTrustedResources();
  assert.ok(resources.length >= 3);
  assert.ok(resources.every((resource) => ['consumerhelpline.gov.in', 'indiacode.nic.in', 'consumeraffairs.nic.in'].some((domain) => new URL(resource.url).hostname === domain || new URL(resource.url).hostname.endsWith(`.${domain}`))));
  assert.equal(retrieveTrustedSources('Maine online seller ko payment kiya, product deliver nahi hua').length, 3);
  assert.equal(retrieveTrustedSources('What does a tenancy dispute mean?').length, 0);
});
