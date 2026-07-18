# EffectScope model boundary

The OpenAI API key exists only in the server environment. Browser code sends no
free-form prompt and never receives credentials.

`POST /api/analyze` enforces:

- JSON-only POST requests and a 12 KB body limit
- ten requests per forwarded client per minute as an application-level backstop
- two allowlisted scenario IDs and six checked-in variant IDs
- scenario-owned prediction and repair IDs
- at most 80 normalized trace events with bounded scalar fields
- contiguous sequence numbers, unique IDs, and one matching terminal event
- a fresh server-side invariant evaluation before any model request
- server-loaded scenario text and source; client event prose is not sent to model
- a ten-second total timeout and at most one retry
- `store: false` and Structured Outputs through Zod
- response validation, including evidence IDs that must exist in submitted trace
- generic public failures without upstream or secret details

React escapes all model text. No model field becomes HTML, code, technical
verdict, or executable input. Clicking evidence only focuses an existing event.

In-memory rate limiting is one defense layer, not a distributed quota system.
Production deployment must also configure Vercel/project traffic controls and an
OpenAI project budget/rate limit.
