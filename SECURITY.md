# NyayaSetu AI Security Notes

## Next.js implementation status

The Next.js application protects workspace pages with Supabase Auth and checks the authenticated user in data APIs. Legal, term, roadmap, and upload/analysis operations have request limits; document objects use a private `legal-documents` bucket and user-folder policies. Database ownership policies and composite owner-to-parent constraints are defined in `supabase/migrations`.

Document content is transmitted to Google Gemini for analysis after the user confirms this in the UI. Stored questions mask email and phone-like strings, but other identifying information may remain. The upload and analysis flows are implemented, while no independent OCR engine, malware scanner, retention policy, or reliable distributed rate limiter is provided. Document storage deletion and database metadata deletion use compensating actions and are not a single transaction. These limits mean the project must not yet be treated as ready for real legal documents or public production use. Run migrations in a test Supabase project and verify RLS and Storage isolation with two accounts before launch.

## Archived prototype boundary

`legacy-prototype/` is an archived static demo. Its login is only a browser `sessionStorage` flag and its responses are canned. It is not part of the Next.js application and must not be deployed or represented as authenticated functionality.

## Additional production controls required before launch

Before handling real legal documents publicly:

- Use Supabase Auth with secure, short-lived sessions and an explicit logout route.
- Store every user-owned row with a `user_id` column and enable Row Level Security.
- Use policies such as `auth.uid() = user_id` for select, insert, update and delete.
- Keep document buckets private. Generate short-lived signed URLs only after an ownership check.
- Never expose a Supabase service-role key or model API key to browser code.
- Validate file extension, detected MIME type, size, safe generated object name and content signature on the server.
- Scan uploads where infrastructure supports it and never execute or serve them as active content.
- Delete both storage objects and metadata in one authorized server-side operation.
- Redact unnecessary personal data before model calls and disclose when content leaves the application.
- Treat retrieved pages and document text as untrusted data. Delimit it in prompts and instruct the model to ignore embedded instructions.
- Apply per-user rate limits, request size limits, token budgets and upload quotas.
- Return generic user-facing errors. Keep technical diagnostics in protected server logs without document contents.
- Use HTTPS/TLS in every deployed environment and encrypt storage at rest.
- Monitor failed authentication, access-denied events, unusual request volume and upload abuse without logging legal document contents.

## Example data ownership model

```text
profiles        id = auth.users.id
queries         id, user_id, input_redacted, created_at
roadmaps        id, user_id, query_id, status, created_at
documents       id, user_id, storage_path, file_hash, created_at
saved_resources id, user_id, source_id, created_at
```

Every API route must derive the user identity from the authenticated server session. It must never accept an arbitrary `user_id` from the client as an authorization decision.

## AI privacy controls

The production orchestration layer should send only the minimum text needed for classification and summarization, strip direct identifiers where practical, avoid training use through the provider's data settings, and attach allow-listed source metadata to generated answers. When retrieval is missing or uncertain, the response should say verification is required rather than fill gaps with model memory.
