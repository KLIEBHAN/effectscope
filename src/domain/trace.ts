export type ScenarioId = "fetch-race" | "missing-cleanup";

export type TraceEventKind =
  | "render"
  | "effect_start"
  | "timer_start"
  | "timer_tick"
  | "timer_stop"
  | "async_start"
  | "async_resolve"
  | "cleanup"
  | "abort"
  | "value_read"
  | "state_write"
  | "stale_write"
  | "invariant_pass"
  | "invariant_fail";

export type TraceData = Record<string, string | number | boolean>;

export type TraceEvent = {
  id: string;
  sequence: number;
  atMs: number;
  kind: TraceEventKind;
  actor: string;
  message: string;
  data?: TraceData;
};

export type TraceEventInput = Omit<TraceEvent, "id" | "sequence" | "atMs">;

export type InvariantState = {
  status: "pending" | "pass" | "fail";
  id: string;
  message: string;
};

export type InvariantEvaluator = (events: readonly TraceEvent[]) => InvariantState;

export type TraceSession = {
  emit: (event: TraceEventInput) => TraceEvent;
  snapshot: () => readonly TraceEvent[];
};

type CreateTraceSessionOptions = {
  runId: string;
  now: () => number;
  evaluate: InvariantEvaluator;
  onEvent?: (event: TraceEvent) => void;
};

export function createTraceSession({
  runId,
  now,
  evaluate,
  onEvent,
}: CreateTraceSessionOptions): TraceSession {
  const events: TraceEvent[] = [];
  let terminalStatus: "pass" | "fail" | null = null;

  const append = (input: TraceEventInput): TraceEvent => {
    const sequence = events.length + 1;
    const event: TraceEvent = {
      ...input,
      id: `${runId}-${sequence}`,
      sequence,
      atMs: now(),
    };

    events.push(event);
    onEvent?.(event);
    return event;
  };

  return {
    emit(input) {
      const event = append(input);

      if (input.kind.startsWith("invariant_") || terminalStatus) {
        return event;
      }

      const invariant = evaluate(events);
      if (invariant.status === "pending") {
        return event;
      }

      terminalStatus = invariant.status;
      append({
        kind: invariant.status === "pass" ? "invariant_pass" : "invariant_fail",
        actor: invariant.id,
        message: invariant.message,
      });

      return event;
    },
    snapshot() {
      return events;
    },
  };
}

export function traceSignature(events: readonly TraceEvent[]): string[] {
  return events.map((event) => {
    const detail = event.data
      ? Object.entries(event.data)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => `${key}=${String(value)}`)
          .join(",")
      : "";

    return `${event.kind}:${event.actor}${detail ? `:${detail}` : ""}`;
  });
}
