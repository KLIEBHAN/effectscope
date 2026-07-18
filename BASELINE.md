# Build Week baseline

Captured: 2026-07-18  
Source: locally imported useEffect Lab snapshot; original filesystem location
omitted from the public record

## Imported state

- React/Vite/TypeScript learning app named `useEffect Lab`
- Seven German lessons covering mount effects, every-render effects, dependencies,
  cleanup, fetch cancellation, and effect-loop pitfalls
- Shared `CodeBlock`, `EffectLog`, and `LessonLayout` components
- No OpenAI API integration
- No scenario harness or invariant evaluator
- No automated tests or CI
- No deployment configuration

The source directory had no commits. Its 34 imported application files had
filesystem timestamps from 2026-07-15 23:31:46 CEST through
2026-07-16 07:04:15 CEST (11 files on July 15, 23 files on July 16). This new
repository records the imported state honestly; no history or timestamps are
fabricated.

Immutable imported baseline:

- Commit: `d6ae06e5350c300179388f96ec6b2a44be492292`
- Tree: `4a782730a6d7452bef232a82128a3a3318300ba7`
- Primary Codex task: `019f7444-a17c-7b51-b05e-eff373c05fbd`

## Verification at capture

```text
npm run build  -> passed
npm run lint   -> passed
```

Capture environment: Node `v25.6.1`, npm `11.15.0`. Supported project runtime is
declared separately in `package.json` and `.nvmrc`.

All EffectScope product functionality will be added after this baseline commit
and documented in `docs/BUILD_LOG.md`.
