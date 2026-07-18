# EffectScope build log

This log distinguishes imported baseline from work completed during OpenAI Build
Week. Commit hashes are added after each milestone.

## 2026-07-18 — Baseline capture

- Imported existing `useEffect Lab` files into new `effectscope` repository.
- Preserved planning artifacts: `PLAN.md` and `REVIEW.md`.
- Recorded baseline limitations in `BASELINE.md`.
- Verified imported application with build and lint before implementation.
- Baseline commit: `c603d0a6dd220a539b18ac90d43deb955a39038b`
- Capture environment: Node `v25.6.1`, npm `11.15.0`
- Primary Codex task: `019f7444-a17c-7b51-b05e-eff373c05fbd`

Commands executed:

```text
npm ci
npm run build
npm run lint
```

### Milestone 0 review

- Two independent GPT-5.6 Sol xhigh reviews inspected repository integrity,
  evidence, dependencies, secret hygiene, and plan compliance.
- Review tasks: `/root/m0_repo_review` and `/root/m0_compliance_review`.
- Initial verdict: FAIL. Baseline was sound, but product preparation, license,
  test stack, CI, Node contract, and evidence detail were incomplete.
- Remediation: added all missing M0 artifacts before feature implementation.

Remediation commit: `ce25051`

Post-remediation verification:

```text
npm run lint   -> passed
npm run test   -> 1 file, 1 test passed
npm run build  -> passed
npm audit --audit-level=high -> 0 vulnerabilities
git diff --check -> passed
```

Second review verdict: FAIL on one formal blocker. Both reviewers required an
explicit human ownership and MIT-publication confirmation. No technical P1/P2
findings remained.

Human confirmation received on 2026-07-18 and recorded verbatim in
`OWNERSHIP.md`. Node and CI versions were pinned, the README's future endpoint
language was corrected, and reviewer task names were added for traceability.

Third review found one remaining runtime-contract mismatch: `jsdom@29` requires
Node 22.13+ while the repository pinned 22.12. Remediation raised `.nvmrc` and CI
to 22.13, constrained `package.json` to supported Node ranges, aligned
`@types/node` with Node 22, and corrected the plan's imported timestamp summary.

## Planned implementation milestones

1. React scenario harnesses, trace domain, invariants, and golden tests
2. English prediction-to-repair product experience
3. GPT-5.6 coach API with Structured Outputs
4. E2E, CI, deployment readiness, and submission documentation

Each milestone requires independent GPT-5.6 Sol xhigh reviews before the next
major implementation step.

## 2026-07-18 — Milestone 1a: trace domain and React harnesses

- Added trace events with stable sequence IDs and terminal invariant events.
- Added browser and manual schedulers; tests control time without replacing
  React's effect lifecycle.
- Added actual React harnesses for Fetch Race and Missing Cleanup.
- Added checked-in bug, fix, and distractor source variants for both scenarios.
- Added pure invariant evaluators plus exact Golden Trace oracles.
- Added coverage for bug paths, correct repairs, ineffective distractors,
  scheduler behavior, and trace-session semantics.

Pre-review verification:

```text
npm run lint   -> passed with no warnings
npm run test   -> 5 files, 11 tests passed
npm run build  -> passed
git diff --check -> passed
```

Initial three-way GPT-5.6 Sol xhigh review verdict: FAIL. Review tasks:
`/root/m1_react_correctness`, `/root/m1_domain_architecture`, and
`/root/m1_test_oracles`. Reviewers found a passive-cleanup race, render-time ref
mutation, mutable trace data, premature invariant passes, actor-insensitive
timer evaluation, incomplete distractor execution/oracles, and scheduler/reset
contract gaps.

Remediation:

- Moved committed-selection mutation into layout effects and added a committed
  generation guard for the cleanup gap and abandoned renders.
- Made abort an optimization plus generation guard, and executed loading-state
  distractor behavior instead of only displaying its source.
- Added explicit trace finalization, runtime invariant-spoof rejection, frozen
  events/data/snapshots, safe observers, and post-terminal no-op emission.
- Correlated requests and timers with unique IDs; evaluators now fold complete
  actor lifecycles and refuse early or partial passes.
- Added terminal scheduler semantics, shared numeric validation, browser adapter
  tests, paired scenario/variant validation, and a scheduler-owning runner.
- Expanded suite with exact distractor Oracles, adversarial evaluator cases,
  cleanup-gap, unmount-gap, suspended transition, reset, throwing observer,
  terminal growth, source/runtime behavior, and Strict Mode coverage.

Remediation verification before re-review:

```text
npm run lint   -> passed with no warnings
npm run test   -> 9 files, 32 tests passed
npm run build  -> passed
git diff --check -> passed
```

First re-review remained FAIL on three boundary cases: variant changes could
reuse a run, observers could reenter TraceSession, and timer evaluation mishandled
a second unmount plus the layout-to-passive cleanup gap. Manual scheduler clock
addition could also overflow.

Second remediation:

- Bound scenario and variant into one immutable `ScenarioRunner`; harnesses now
  accept that coherent runner instead of independent run, variant, scheduler,
  and trace props.
- Split trace reader/writer/finalizer capabilities. Only runner finalizes;
  observers cannot emit or finalize reentrantly.
- Separated successful `finish()` from verdict-free `dispose()` for abandoned
  runs, while both paths terminate scheduled work.
- Reworked timer evaluation as a complete cycle-0/cycle-1 phase proof. Clean
  second unmounts pass, active timers owned by unmounted components fail, and a
  passive-cleanup-gap tick is judged by its eventual matching stop.
- Added atomic bug/fix runner-switch tests for both scenarios, real React cleanup
  gap and second-unmount tests, observer-finalize rejection, cancellation tests,
  incomplete-cycle adversarial cases, and finite-clock overflow protection.

Second-remediation verification:

```text
npm run lint   -> passed with no warnings
npm run test   -> 9 files, 44 tests passed
npm run build  -> passed
git diff --check -> passed
```

Second re-review remained FAIL on final adversarial edges: timer lifecycle used
unordered flags, reused public run IDs could preserve React state, observer
callbacks could cancel/dispose reentrantly, terminal publication preceded
scheduler teardown, and interval rescheduling could overflow.

Third remediation:

- Replaced timer flags with monotone, owner-correlated lifecycle phases from
  initial mount through optional replacement unmount. Strict Mode setup replay
  remains allowed inside the current phase; impossible ordering and wrong-owner
  unmounts fail.
- Added internal opaque `runKey` allocation. Fresh runners remount harness state
  even when a caller reuses a display run ID.
- Guarded trace cancellation and runner finish/dispose during observer delivery.
  Scheduler now terminates before terminal verdict publication, so terminal
  observers cannot execute hidden work.
- Removed overflowing interval tasks before callback execution and added clock,
  due-time, and reschedule overflow coverage.
- Added reused-ID React reset, terminal-observer, observer-cancel/dispose,
  wrong-order/wrong-owner lifecycle, and symmetric Missing Cleanup variant-switch
  tests.

Third-remediation verification:

```text
npm run lint   -> passed with no warnings
npm run test   -> 9 files, 51 tests passed
npm run build  -> passed
git diff --check -> passed
```

Third re-review left one P2: finite IEEE-754 addition could round a positive
delta to the current large clock value. Shared checked time addition now requires
both finiteness and strict forward progress for positive durations, initial due
times, and interval rescheduling. Non-progressing tasks are rejected or removed
before callback execution.

Final Milestone 1a verdict: PASS from all three GPT-5.6 Sol xhigh reviewers at
`ad5266b`. No P0, P1, or P2 findings remained. Reviewers independently reran
React lifecycle adversarial cases, domain-contract repros, all six Golden Oracles,
scheduler extremes, lint, tests, build, and diff checks.

## 2026-07-18 — Milestone 2: diagnosis workspace

- Replaced imported lesson navigation with focused two-scenario product flow.
- Added mandatory prediction gate, checked-in source view, actual browser-timed
  React execution, live normalized timeline, deterministic verdict, repair
  selection, distractor execution, and fixed-run proof.
- Added atomic browser runners for Fetch Race and Missing Cleanup. Scenario
  controls dispose old runs before switch/reset and preserve completed proofs.
- Added responsive instrument-lab visual system with visible keyboard focus,
  semantic radio groups, progressbar, live trace region, reduced-motion behavior,
  and mobile layout.
- Added full component tests for both mandatory learning loops, including bug
  verdict and successful repair.
- Rendered and visually inspected full-page desktop and 390 px mobile captures.

Pre-review verification:

```text
npm run lint   -> passed with no warnings
npm run test   -> 9 files, 53 tests passed
npm run build  -> passed
git diff --check -> passed
```

Initial three-way GPT-5.6 Sol xhigh review verdict: FAIL. Review tasks:
`/root/m2_functional_react`, `/root/m2_ux_accessibility`, and
`/root/m2_tests_performance`. Reviewers found deadline-driven orchestration that
could finalize before React commits under timer throttling, disabled in-flight
reset, source-preview/runtime mismatch, incomplete prediction feedback, false
status labels, hidden terminal events, mobile loop clipping, low custom-control
contrast, missing dynamic focus/live-region semantics, and no executed browser
tests in CI.

Remediation:

- Replaced absolute finish deadlines with trace-causal orchestration. Fetch Race
  advances after request start and finalizes only once request lifecycles decide
  the invariant. Missing Cleanup unmounts after the initial tick, remounts after
  committed unmount evidence, and finalizes after replacement work.
- Added synchronous commit boundaries only at controlled interaction transitions,
  preventing coalesced/throttled timers from overtaking React commits.
- Enabled in-flight reset, kept candidate repairs separate from executed source,
  and derived terminal, progress, run, repair, and model statuses from actual state.
- Added prediction-versus-observation feedback that remains visible after repair
  proof, timeline auto-follow, permanent atomic status announcements, log semantics,
  terminal focus management, truthful historical progress, and verified repair UI.
- Reordered mobile flow to Prediction, Run, Source; fitted all five learning-loop
  steps without horizontal scrolling; raised control-border contrast; improved
  disabled-primary and source-label affordances.
- Added coalesced-timer, mid-run reset, scenario-switch, distractor, pending-source,
  prediction, focus, and status component coverage. Added five real Chromium E2E
  flows and made Playwright part of GitHub Actions.

Remediation verification before re-review:

```text
npm run lint   -> passed with no warnings
npm run test   -> 9 files, 57 tests passed
npm run build  -> passed
npm run test:e2e -> 5 Chromium tests passed
git diff --check -> passed
mobile width   -> 390 px document in 390 px viewport
```

First re-review remained FAIL on three cross-state/runtime edges. A long
main-thread stall could let the slow Fetch B timer expire before fast Fetch C
was registered, while static coaching still claimed C appeared first. Later
ticks from the intentionally leaked cycle-0 timer could also schedule a second
unmount of the replacement component. Finally, selecting a different repair
after proof retained the prior repair's verified state.

Second remediation:

- Added a Fetch-specific aligned request scheduler. React still starts each
  effect, but both request countdowns release from one causal epoch; a delayed
  selection commit cannot invert the controlled fast-C/slow-B outcome.
- Added trace-derived bug observation storage. Prediction assessment and actual
  outcome now require the claimed write/tick sequence instead of trusting static
  scenario copy.
- Made Missing Cleanup unmount/remount orchestration permanently one-shot per
  run, so leaked old-timer ticks remain evidence and cannot control UI lifecycle.
- Bound Verified and Rejected repair states to both selected and executed variant
  IDs plus terminal stage. New selections after proof return to Hypothesis/Prove;
  tested distractors return to Rejected/Repair.
- Added scheduler epoch/cancellation tests, trace-feedback tests, replacement-
  mount assertions, post-proof alternative selection coverage, and a real
  Chromium 1.6-second main-thread-stall regression.

Second-remediation verification before re-review:

```text
npm run lint   -> passed with no warnings
npm run test   -> 11 files, 61 tests passed
npm run build  -> passed
npm run test:e2e -> 7 Chromium tests passed
git diff --check -> passed
```

Final Milestone 2 verdict: PASS from all three GPT-5.6 Sol xhigh reviewers at
`7aba94c`. No P0, P1, or P2 findings remained. Reviewers independently
reproduced the 1.6-second Fetch stall, both Missing Cleanup leak paths,
reset/switch disposal, all repair-state transitions, keyboard focus, terminal
auto-follow, and 1440/760/390 px layouts. Current evidence: 61 unit/component
tests, seven Chromium E2E flows, lint, build, CI wiring, diff checks, and clean
worktree all passed.

## 2026-07-18 — Milestone 3: grounded GPT-5.6 coach

- Added strict shared Zod contracts for both scenario attempts and structured
  coaching output.
- Added `POST /api/analyze` through the official OpenAI Responses API with
  GPT-5.6 model-family enforcement, Structured Outputs, server-loaded source,
  fresh invariant evaluation, evidence-ID validation, `store: false`, bounded
  retry/timeout/token/body limits, rate limiting, and generic fallback errors.
- Added explicit browser coaching requests, exact-attempt cache, request abort,
  structured coach panel, and evidence-to-timeline focus.
- Added contract tests for forged truth, cross-scenario data, invalid evidence,
  output schema, body/method/media limits, rate limits, timeout, missing key,
  model family, and Vercel Web handler signature.
- Added mocked Chromium coaching and fallback flows plus visually inspected
  desktop and mobile captures.

Feature commit: `1daa84a`

Pre-review verification:

```text
npm run check -> 14 test files, 82 tests passed; lint and build passed
npm run test:e2e -> 10 Chromium tests passed
npm audit --audit-level=high -> 0 vulnerabilities
git diff --check -> passed
```

Three-way GPT-5.6 Sol xhigh review tasks: `/root/m3_api_security`,
`/root/m3_openai_contract`, and `/root/m3_ui_e2e`. Security and OpenAI-contract
reviews passed. UI/E2E review found two P2 gaps: client reset hid late UI output
but did not propagate cancellation into the server's OpenAI signal, and successful
asynchronous coaching lacked a persistent screen-reader announcement.

Remediation combined `request.signal` with the server timeout, added an upstream
cancellation contract test, added a persistent polite live region for loading,
success, and failure, and asserted the success announcement in Chromium.

Remediation commit: `8602c4b`

Final Milestone 3 verdict: PASS from all three reviewers. No P0, P1, or P2
findings remained. Post-remediation evidence: 83 tests, ten Chromium E2E flows,
lint, build, and diff checks passed.

## 2026-07-18 — Milestone 4: release and submission readiness

- Rebuilt the README around the one-minute test path, deterministic/model trust
  boundary, architecture, GPT-5.6 usage, Codex workflow, clean setup, deployment,
  privacy, and Build Week delta.
- Added architecture, dependency/license inventory, Devpost draft,
  sub-three-minute demo script, and explicit human/external submission checklist.
- Added inspected 1440 px desktop and 390 px mobile screenshots with mocked,
  schema-valid coaching; no mock output is represented as a live production call.
- Added a Chromium GPT-5.6 coaching path for Missing Cleanup, including request
  scenario ownership and evidence focus.
- Removed the unused Framer Motion runtime and its three transitive packages.

Artifact commit: `5d7a97f`

Fresh-checkout release proof:

```text
git clone --local --no-hardlinks -> clean clone
npm ci --engine-strict -> 126 packages, 0 vulnerabilities
npm run check -> 14 test files, 83 tests; lint and production build passed
npx playwright install chromium -> passed
npm run test:e2e -> 11 Chromium tests passed
npm audit --audit-level=high -> 0 vulnerabilities
git diff --check -> passed
git status --short -> clean
```

Tracked-file and Git-history scans found no API key or common GitHub/Vercel token
pattern. Only `.env.example` is tracked, with an empty key value.

External release gates remain deliberately open: this environment has no OpenAI
API key, and Vercel CLI 56.3.1 could not build without a valid project login.
Therefore no live-model claim, public deployment, YouTube upload, Devpost
submission, or `/feedback` submission ID is fabricated. Exact human actions are
listed in `docs/SUBMISSION_CHECKLIST.md`.

### Final local release review

Three independent GPT-5.6 Sol xhigh tasks reviewed release candidate `ec8c3bf`:

- `/root/final_technical`: full runtime, React lifecycle, model boundary,
  accessibility, performance, and adversarial-test review
- `/root/final_submission`: claim-to-implementation, setup, architecture,
  Devpost, demo-script, screenshot, and formal-artifact review
- `/root/final_release`: fresh install, engine/lock/CI, audit, secret, license,
  Vercel shape, clean-worktree, and Definition-of-Done evidence review

All three returned PASS with zero P0, P1, or P2 findings. Independent reruns
confirmed 83 Vitest tests, 11 Chromium E2E flows, lint, typecheck, production
build, zero audit vulnerabilities, clean diff, and clean worktree. External
publication gates listed above were explicitly recognized, not mistaken for
completed local work.
