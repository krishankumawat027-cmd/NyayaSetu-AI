# NyayaSetu AI

NyayaSetu AI is a legal-information prototype for the theme **AI for Legal Assistance & Access**. Its intended flow is Explain → Verify → Plan, with an English, Hindi, and Hinglish assistant, private document intake, legal resources, and a possible next-step roadmap.

## Run the Next.js application

Use Node.js 20.9 or later:

```powershell
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server-only `GEMINI_API_KEY` in `.env.local`. Apply the SQL migrations in `supabase/migrations` to the Supabase project. Never expose service-role or model keys to browser code.

Useful checks:

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Implemented application behavior

- Supabase sign-in, sign-up, email callback, password reset, session-based protected pages, and editable profile/language preferences.
- Legal assistant and term-explainer calls are authenticated server requests. Gemini output is schema-validated and errors are surfaced for retry. The assistant receives only the app's allow-listed sources.
- Document upload, private storage, Gemini PDF/image analysis, saved analysis status/results, view, and delete flows are implemented with per-user ownership checks.
- Roadmap generation, steps, progress, situation-specific evidence checklist, custom evidence items, and deletion persist in Supabase.
- The official resource library uses a small allow-list; users can save and remove those resources in Supabase.
- English, Hindi, and Hinglish preferences are saved to the signed-in user's profile and used by assistant, roadmap, and document analysis requests.
- A retired static HTML prototype is kept under `legacy-prototype/` for reference only. It contains demo-only session storage and canned content; do not deploy or use it as the application.

## Known product and production gaps

This repository is not yet production-ready. Legal sources are a short fixed consumer-law list, not comprehensive or dynamically updated legal retrieval; generated explanations and term definitions are not independently verified against current legislation or case law. Document content is sent to Gemini only after an explicit UI consent, but there is no independent OCR engine or asynchronous job queue. User questions are stored (with email addresses and phone-like strings masked) when they are used to create a roadmap; names and addresses are not automatically masked. Storage-object deletion and database deletion cannot be made atomic with the current Supabase client flow.

The API rate limiter is process-local and does not provide reliable distributed limits in a multi-instance deployment. Configure shared rate limits, provider quotas, monitoring, and hosting-level request limits before public launch. Apply the migrations in a non-production Supabase project and test cross-account RLS and Storage isolation. The automated suite currently covers input validation, not authenticated browser or provider integration. The complete registration-to-delete scenario still needs a disposable email identity and live Supabase/Gemini test environment.

## Legal safety

NyayaSetu AI provides general legal information for educational and informational purposes. It is not a substitute for professional legal advice. It should communicate uncertainty, avoid guaranteeing outcomes, and direct users to official sources or qualified professionals for important matters.
