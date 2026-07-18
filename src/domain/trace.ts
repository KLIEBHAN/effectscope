export type ScenarioId = "fetch-race" | "missing-cleanup";

export type RuntimeTraceEventKind =
  | "render"
  | "effect_start"
  | "timer_start"
  | "timer_tick"
  | "timer_stop"
  | "async_start"
  | "async_resolve"
  | "cleanup"
  | "abort"
  | "response_ignored"
  | "loading_change"
  | "value_read"
  | "state_write"
  | "stale_write";

export type TraceEventKind =
  | RuntimeTraceEventKind
  | "invariant_pass"
  | "invariant_fail";

export type TraceData = Readonly<Record<string, string | number | boolean>>;

export type TraceEvent = Readonly<{
  id: string;
  sequence: number;
  atMs: number;
  kind: TraceEventKind;
  actor: string;
  message: string;
  data?: TraceData;
}>;

export type TraceEventInput = {
  kind: RuntimeTraceEventKind;
  actor: string;
  message: string;
  data?: Record<string, string | number | boolean>;
};

export type InvariantState = Readonly<{
  status: "pending" | "pass" | "fail";
  id: string;
  message: string;
}>;

export type InvariantEvaluator = (events: readonly TraceEvent[]) => InvariantState;

export type TraceSession = {
  emit: (event: TraceEventInput) => TraceEvent | null;
  finalize: () => TraceEvent;
  isFinalized: () => boolean;
  snapshot: () => readonly TraceEvent[];
};

type CreateTraceSessionOptions = {
  runId: string;
  now: () => number;
  evaluate: InvariantEvaluator;
  onEvent?: (event: TraceEvent) => void;
  onObserverError?: (error: unknown) => void;
};

const invariantKinds = new Set<TraceEventKind>([
  "invariant_pass",
  "invariant_fail",
]);

export function createTraceSession({
  runId,
  now,
  evaluate,
  onEvent,
  onObserverError,
}: CreateTraceSessionOptions): TraceSession {
  const events: TraceEvent[] = [];
  let finalized = false;

  const notify = (event: TraceEvent) => {
    try {
      onEvent?.(event);
    } catch (error) {
      try {
        onObserverError?.(error);
      } catch {
        // Observers cannot alter scenario execution or trace truth.
      }
    }
  };

  const append = (
    input: Omit<TraceEvent, "id" | "sequence" | "atMs">,
  ): TraceEvent => {
    const event = Object.freeze({
      ...input,
      data: input.data ? Object.freeze({ ...input.data }) : undefined,
      id: `${runId}-${String(events.length + 1)}`,
      sequence: events.length + 1,
      atMs: now(),
    });

    events.push(event);
    notify(event);
    return event;
  };

  return {
    emit(input) {
      if (invariantKinds.has(input.kind as TraceEventKind)) {
        throw new Error("Invariant events can only be emitted by TraceSession.finalize().");
      }
      if (finalized) {
        return null;
      }

      return append(input);
    },
    finalize() {
      if (finalized) {
        const terminal = events.at(-1);
        if (!terminal || !invariantKinds.has(terminal.kind)) {
          throw new Error("Finalized trace has no terminal invariant event.");
        }
        return terminal;
      }

      const invariant = evaluate(Object.freeze([...events]));
      finalized = true;
      const incomplete = invariant.status === "pending";

      return append({
        kind: invariant.status === "pass" ? "invariant_pass" : "invariant_fail",
        actor: invariant.id,
        message: incomplete ? `Run incomplete: ${invariant.message}` : invariant.message,
        data: incomplete ? { incomplete: true } : undefined,
      });
    },
    isFinalized() {
      return finalized;
    },
    snapshot() {
      return Object.freeze([...events]);
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
