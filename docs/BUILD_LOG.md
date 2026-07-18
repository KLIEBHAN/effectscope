# EffectScope build log

This log distinguishes imported baseline from work completed during OpenAI Build
Week. Commit hashes are added after each milestone.

## 2026-07-18 — Baseline capture

- Imported existing `useEffect Lab` files into new `effectscope` repository.
- Preserved planning artifacts: `PLAN.md` and `REVIEW.md`.
- Recorded baseline limitations in `BASELINE.md`.
- Verified imported application with build and lint before implementation.
- Baseline commit: `d6ae06e5350c300179388f96ec6b2a44be492292`
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

Remediation commit: `c415ffa`

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
`7a17452`. No P0, P1, or P2 findings remained. Reviewers independently reran
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
