# Submission checklist

Code and documentation checks are reproducible. Publication actions stay open
until a human verifies external URLs and account settings.

## Product and repository

- [x] Two complete mandatory scenarios
- [x] Bug, effective repair, and distractor variants for both scenarios
- [x] Deterministic runtime verdict independent of model output
- [x] GPT-5.6 request/response boundary and safe fallback
- [x] Evidence buttons focus validated trace events
- [x] Responsive 390 px layout, keyboard focus, live status, reduced motion
- [x] MIT license and explicit ownership/publication authorization
- [x] Baseline provenance and Build Week commit/review log
- [x] README setup, test path, architecture, privacy, and Codex/GPT explanation
- [x] Devpost draft and sub-three-minute video script

## Automated release gate

Run from a fresh checkout using a supported Node version:

```bash
npm ci --engine-strict
npm run check
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
git diff --check
```

- [x] All commands pass at release commit `5d7a97f` in a fresh local clone
- [x] Repository contains no `.env`, API key, token, personal data, or private URL
- [x] GitHub Actions passes on public/default branch

## Live deployment

- [ ] Create/link Vercel project from intended public repository
- [ ] Configure `OPENAI_API_KEY` server-side
- [ ] Confirm `OPENAI_MODEL` is GPT-5.6 family or keep default Terra
- [ ] Configure Vercel traffic controls and OpenAI project spend/rate limits
- [ ] Production smoke: Fetch Race bug, coaching, repair, proof
- [ ] Production smoke: Missing Cleanup bug, coaching, repair, proof
- [ ] Timeout/fallback keeps deterministic lab usable
- [ ] Mobile production page has no horizontal overflow
- [ ] Check Network panel: no API key; model request only after explicit click
- [ ] Record final production URL

## Video

- [ ] Record production flow using `DEMO_SCRIPT.md`
- [ ] Real GPT-5.6 response and evidence focus are visible
- [ ] Both scenarios appear; primary repair is proved
- [ ] Codex and GPT-5.6 usage are explained explicitly
- [ ] English voiceover/captions are understandable
- [ ] Final duration is below 3:00
- [ ] Upload publicly to YouTube and verify while signed out

## Devpost

- [ ] Paste and proofread `DEVPOST.md`
- [ ] Select Education category
- [ ] Add verified demo, repository, and YouTube links
- [ ] Add primary Codex `/feedback` session ID
- [ ] If repository stays private, grant both jury addresses access
- [ ] Verify every link in a signed-out browser
- [ ] Submit before internal deadline: 21 July 2026, 18:00 CEST
- [ ] Save confirmation screenshot and submission URL
