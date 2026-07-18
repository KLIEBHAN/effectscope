# EffectScope

Predict what a React effect will do, run an instrumented component, inspect the
actual trace, then repair the bug with evidence-backed GPT-5.6 coaching.

EffectScope is being built for the Education track of OpenAI Build Week. The
current repository begins with the imported `useEffect Lab` baseline documented
in [`BASELINE.md`](./BASELINE.md). New work is tracked in
[`docs/BUILD_LOG.md`](./docs/BUILD_LOG.md).

## Requirements

- Node.js 22.12 or newer
- npm 11 or compatible

Using nvm:

```bash
nvm use
npm ci
```

## Local development

```bash
npm run dev
```

## Verification

```bash
npm run lint
npm run test
npm run build
```

Run every local check:

```bash
npm run check
```

Chromium E2E support is configured and will become part of CI after the primary
diagnosis flow exists:

```bash
npx playwright install chromium
npm run test:e2e
```

## OpenAI configuration

The coach endpoint uses the server-side OpenAI SDK and the Responses API with
Structured Outputs. Copy `.env.example` to `.env.local`, then set
`OPENAI_API_KEY`. Never expose this value through a `VITE_` variable.

Default runtime model: `gpt-5.6-terra`. Override with `OPENAI_MODEL` when needed.

## Project records

- [`PLAN.md`](./PLAN.md) — accepted implementation and submission plan
- [`REVIEW.md`](./REVIEW.md) — independent plan review and disposition
- [`BASELINE.md`](./BASELINE.md) — imported state and immutable commit evidence
- [`OWNERSHIP.md`](./OWNERSHIP.md) — authorization record and publication gate
- [`docs/BUILD_LOG.md`](./docs/BUILD_LOG.md) — Build Week changes and review trail

## License

MIT, subject to the human publication confirmation recorded in
[`OWNERSHIP.md`](./OWNERSHIP.md).
