import type {
  AnalyzeAttemptRequest,
  CoachFeedback,
} from "../infrastructure/feedbackSchema";

export function makeFetchBugRequest(): AnalyzeAttemptRequest {
  const rawEvents = [
    ["async_start", "request-B-1", { requestId: "request-B-1", selection: "B" }],
    ["async_start", "request-C-2", { requestId: "request-C-2", selection: "C" }],
    ["async_resolve", "request-C-2", { requestId: "request-C-2", selection: "C" }],
    ["state_write", "todo-C", { requestId: "request-C-2", selection: "C" }],
    ["async_resolve", "request-B-1", { requestId: "request-B-1", selection: "B" }],
    ["stale_write", "todo-B", { requestId: "request-B-1", selection: "B" }],
    ["invariant_fail", "latest-request-wins", undefined],
  ] as const;

  return {
    scenarioId: "fetch-race",
    predictionId: "stale-overwrite",
    repairId: null,
    sourceVariant: "fetch-race/bug-v1",
    invariantPassed: false,
    trace: rawEvents.map(([kind, actor, data], index) => ({
      id: `run-1-${String(index + 1)}`,
      sequence: index + 1,
      atMs: index * 100,
      kind,
      actor,
      message: `${kind} observed.`,
      data,
    })),
  };
}

export function makeCoachFeedback(): CoachFeedback {
  return {
    verdict: "correct",
    misconception: "You correctly expected arrival order, not selection order, to win.",
    evidence: [
      {
        eventId: "run-1-6",
        explanation: "The older B request performed the stale state write.",
      },
    ],
    hint: "Look for cleanup that makes obsolete request work unable to commit.",
    transferQuestion: {
      prompt: "Which lifecycle boundary can invalidate request B?",
      options: ["Effect cleanup", "Render return value", "Loading state"],
    },
  };
}

export function makeMissingCleanupBugRequest(): AnalyzeAttemptRequest {
  const rawEvents = [
    ["render", "instance-1", { instanceId: "instance-1", cycle: 0, mounted: true }],
    ["effect_start", "effect-instance-1", { instanceId: "instance-1", cycle: 0 }],
    ["timer_start", "timer-instance-1-1", { instanceId: "instance-1", cycle: 0 }],
    ["timer_tick", "timer-instance-1-1", { instanceId: "instance-1", cycle: 0, tick: 1 }],
    ["render", "instance-1", { instanceId: "instance-1", cycle: 0, mounted: false }],
    ["render", "instance-2", { instanceId: "instance-2", cycle: 1, mounted: true }],
    ["effect_start", "effect-instance-2", { instanceId: "instance-2", cycle: 1 }],
    ["timer_start", "timer-instance-2-1", { instanceId: "instance-2", cycle: 1 }],
    ["timer_tick", "timer-instance-1-1", { instanceId: "instance-1", cycle: 0, tick: 2 }],
    ["timer_tick", "timer-instance-2-1", { instanceId: "instance-2", cycle: 1, tick: 1 }],
    ["invariant_fail", "single-active-timer", undefined],
  ] as const;

  return {
    scenarioId: "missing-cleanup",
    predictionId: "two-timers",
    repairId: null,
    sourceVariant: "missing-cleanup/bug-v1",
    invariantPassed: false,
    trace: rawEvents.map(([kind, actor, data], index) => ({
      id: `cleanup-run-1-${String(index + 1)}`,
      sequence: index + 1,
      atMs: index * 100,
      kind,
      actor,
      message: `${kind} observed.`,
      data,
    })),
  };
}
