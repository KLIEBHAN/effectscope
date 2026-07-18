# EffectScope demo script

Target: 2:35. Hard limit: under 3:00. English voiceover. Record production build
at 1440×900 or 1920×1080 with browser zoom at 100%.

## Shot list and voiceover

### 0:00–0:15 — Problem and promise

**Screen:** EffectScope header, two scenarios, Fetch Race title.

**Voiceover:**

> React effect bugs are hard to learn because source code hides the order in
> which renders, cleanup, and asynchronous callbacks actually happen.
> EffectScope makes that execution visible, then uses GPT-5.6 to coach from
> evidence instead of guessing.

### 0:15–0:32 — Commit prediction

**Screen:** Select “Todo C appears, then B overwrites it.”

**Voiceover:**

> I start by committing a prediction. The lab will run a checked-in React
> component, not generated code or a simulation.

### 0:32–0:58 — Run and read trace

**Screen:** Run bug sequence. Pause on Events 8–11 and rendered Todo B.

**Voiceover:**

> Request B starts first. C is selected next and resolves first, writing the
> correct state. Then the stale B callback writes last. EffectScope's
> deterministic evaluator marks the latest-request-wins invariant as violated.

### 0:58–1:24 — GPT-5.6 grounded coach

**Screen:** Press “Ask GPT-5.6 coach.” Click its Event 10 evidence.

**Voiceover:**

> GPT-5.6 receives the validated prediction, registered source variant, and
> normalized trace through Structured Outputs. It cannot change the verdict or
> cite an unknown event. Clicking its evidence focuses the exact stale write in
> the runtime timeline.

### 1:24–1:52 — Repair and prove

**Screen:** Select abort-and-guard repair, run it, pause on cleanup/abort and pass.

**Voiceover:**

> I choose the smallest repair: abort obsolete work in cleanup and guard the
> committed generation. The same interaction now records cleanup and abort, no
> stale state write, and a proved invariant. The fix is demonstrated by a new
> execution, not by selecting the expected answer.

### 1:52–2:10 — Second scenario

**Screen:** Open Missing Cleanup; show old and replacement timer ticks, then the
clear-interval repair result.

**Voiceover:**

> The second scenario exposes a timer that outlives its component. Clearing the
> interval in effect cleanup restores single ownership. Both scenarios use the
> same prediction, evidence, repair, and proof loop.

### 2:10–2:30 — Codex and architecture

**Screen:** Brief repository view: `src/domain`, `src/scenarios`, `api/analyze.ts`,
green CI/test result, Build Log.

**Voiceover:**

> Codex built the trace domain, real React harnesses, deterministic Oracles,
> interface, API boundary, and tests. After every major milestone, independent
> GPT-5.6 Sol xhigh agents reviewed correctness, security, accessibility, and
> browser behavior; every material finding was fixed and re-reviewed.

### 2:30–2:35 — Close

**Screen:** Product title plus repository and demo URLs.

**Voiceover:**

> EffectScope: runtime evidence before model explanation.

## Recording checklist

- Use production deployment with real GPT-5.6 response.
- Prewarm deployment and verify API quota before recording.
- Hide browser bookmarks, tokens, notifications, and personal tabs.
- Keep pointer slow and visible; avoid scrolling while speaking key lines.
- Show model evidence focus and successful repair in one continuous path.
- Add captions; verify public YouTube playback while signed out.
- Export 1080p, then confirm final duration is below 3:00.
