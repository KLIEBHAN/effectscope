# Devpost submission draft

Replace bracketed publication fields only after deployment and video verification.

## Project name

EffectScope

## Tagline

See what React actually did, then learn from trace-grounded GPT-5.6 coaching.

## Category

Education

## Inspiration

React developers often memorize `useEffect` rules without forming a reliable
mental model of render, cleanup, closure, timer, and request lifetimes. Source
code alone does not show the temporal gap between cause and symptom, while a
general chatbot may confidently describe an execution that never happened.

## What it does

EffectScope asks a learner to predict a controlled effect scenario before running
it. A real instrumented React component records render, effect, cleanup, async,
timer, and state events. A deterministic evaluator decides whether the scenario
invariant passed. The learner inspects the trace, chooses a repair, and reruns the
same interaction to prove the fix.

GPT-5.6 optionally compares the learner's prediction, the registered source
variant, selected repair, and validated runtime trace. It returns a structured
learning assessment, exact evidence IDs, the smallest useful hint, and a transfer
question. Clicking evidence focuses the cited runtime event.

## How we built it

- React 19, TypeScript, and Vite for the product
- Actual scenario harnesses for Fetch Race and Missing Cleanup
- Immutable trace sessions and pure deterministic invariant evaluators
- Checked-in bug, fix, and distractor variants with Golden Trace Oracles
- OpenAI Responses API using `gpt-5.6-terra` and strict Zod Structured Outputs
- Vercel serverless boundary with server-side scenario loading, request
  revalidation, body/rate/token limits, cancellation, timeout, and safe fallback
- Vitest, Testing Library, and Chromium Playwright E2E

## How GPT-5.6 is used

GPT-5.6 does not simulate React or determine pass/fail. The runtime trace is the
technical truth. Server validation rejects forged scenario/variant combinations,
recomputes the invariant, excludes client event prose from model input, validates
the structured response, and rejects evidence IDs absent from the trace. This
makes the model useful where it is strongest: translating concrete evidence into
a personalized mental-model explanation.

## How Codex was used

Codex implemented the trace domain, real React scenario harnesses, schedulers,
deterministic Oracles, responsive accessible workspace, OpenAI boundary, tests,
and submission documentation. Primary task:
`019f7444-a17c-7b51-b05e-eff373c05fbd`.

After each major implementation step, independent GPT-5.6 Sol xhigh subagents
reviewed different failure surfaces. Reviews found lifecycle races, scheduler
overflow, trace mutability, delayed-browser ordering, status/accessibility gaps,
and upstream cancellation gaps. Each finding was reproduced, fixed, tested, and
re-reviewed before the next milestone.

## Challenges

The hardest problem was keeping the demonstration deterministic without faking
React lifecycle order. Browser timer throttling and long main-thread stalls can
otherwise invert a teaching scenario. EffectScope uses causal trace transitions
and a shared request-release epoch while preserving real effect execution.

Another challenge was preventing the AI explanation from becoming a competing
truth source. Strict request ownership, server-side invariant evaluation,
Structured Outputs, and evidence-ID validation keep that boundary explicit.

## Accomplishments

- Two complete predict-run-observe-repair-prove scenarios
- Six executable source variants with exact Golden Traces
- Both ineffective distractors fail for the right reason
- Trace-grounded GPT-5.6 coaching for both scenarios
- Deterministic fallback when OpenAI is unavailable
- Keyboard, screen-reader live status, reduced motion, and 390 px mobile support
- Adversarial tests for cancellation, Strict Mode, reentrancy, timer stalls,
  clock overflow, reset, and scenario switching

## What we learned

AI teaching works best when the system first creates inspectable evidence and
gives the model a narrow explanatory role. Determinism also comes from causal
state transitions and lifecycle ownership, not from hoping browser timers fire
on schedule.

## What's next

- Add Stale Closure as a third scenario
- Let instructors author reviewed scenario packs without arbitrary browser code
- Add learner reflection before revealing the repair choices
- Measure whether evidence-linked coaching improves transfer to unfamiliar bugs

## Links

- Live demo: `[ADD VERIFIED PRODUCTION URL]`
- Source repository: `[ADD PUBLIC REPOSITORY URL]`
- Public YouTube demo under three minutes: `[ADD VERIFIED VIDEO URL]`
