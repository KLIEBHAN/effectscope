import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ScenarioScheduler, ScheduledHandle } from "../../domain/scheduler";
import type { TraceSession } from "../../domain/trace";
import { fetchRaceVariants, type FetchRaceVariantId } from "./variants";

export type TodoSelection = "B" | "C";

type FetchRaceHarnessProps = {
  /** New run IDs require a fresh scheduler and trace; variant changes start a new run. */
  runId: string;
  selected: TodoSelection;
  variantId: FetchRaceVariantId;
  scheduler: ScenarioScheduler;
  trace: TraceSession;
};

type FetchRaceProbeProps = Omit<FetchRaceHarnessProps, "runId">;

const requestDelay: Record<TodoSelection, number> = {
  B: 1_200,
  C: 200,
};

export function FetchRaceHarness({
  runId,
  variantId,
  ...probeProps
}: FetchRaceHarnessProps) {
  return (
    <FetchRaceProbe
      key={`${runId}:${variantId}`}
      {...probeProps}
      variantId={variantId}
    />
  );
}

function FetchRaceProbe({
  selected,
  variantId,
  scheduler,
  trace,
}: FetchRaceProbeProps) {
  const variant = fetchRaceVariants[variantId];
  const committedSelection = useRef(selected);
  const committedGeneration = useRef(0);
  const requestSequence = useRef(0);
  const activeRequests = useRef(new Set<string>());
  const [visibleTodo, setVisibleTodo] = useState<TodoSelection | null>(null);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    committedSelection.current = selected;
    committedGeneration.current += 1;
    trace.emit({
      kind: "render",
      actor: `selection-${selected}`,
      message: `Committed render for selection ${selected}.`,
      data: { selection: selected },
    });

    return () => {
      committedGeneration.current += 1;
    };
  }, [selected, trace]);

  useEffect(() => {
    const requestNumber = ++requestSequence.current;
    const requestId = `request-${selected}-${String(requestNumber)}`;
    const requestGeneration = committedGeneration.current;
    const isLatest = () => committedSelection.current === selected;
    const requests = activeRequests.current;
    let handle: ScheduledHandle | null = null;

    trace.emit({
      kind: "effect_start",
      actor: `effect-${selected}`,
      message: `Effect started for selection ${selected}.`,
      data: { selection: selected, requestId },
    });

    requests.add(requestId);
    trace.emit({
      kind: "async_start",
      actor: requestId,
      message: `Request ${selected} started.`,
      data: {
        requestId,
        selection: selected,
        delayMs: requestDelay[selected],
      },
    });

    if (variant.hasLoadingIndicator) {
      setLoading(true);
      trace.emit({
        kind: "loading_change",
        actor: `loading-${selected}`,
        message: `Loading indicator shown for ${selected}.`,
        data: { requestId, selection: selected, loading: true },
      });
    }

    handle = scheduler.scheduleTimeout(requestDelay[selected], () => {
      requests.delete(requestId);
      const latest = isLatest();

      trace.emit({
        kind: "async_resolve",
        actor: requestId,
        message: `Request ${selected} resolved.`,
        data: { requestId, selection: selected },
      });

      if (
        variant.guardsCommittedGeneration &&
        requestGeneration !== committedGeneration.current
      ) {
        trace.emit({
          kind: "response_ignored",
          actor: requestId,
          message: `Obsolete response ${selected} was ignored.`,
          data: { requestId, selection: selected },
        });
        return;
      }

      trace.emit({
        kind: latest ? "state_write" : "stale_write",
        actor: `todo-${selected}`,
        message: latest
          ? `Visible todo updated to ${selected}.`
          : `Stale request ${selected} overwrote the latest selection.`,
        data: { requestId, selection: selected },
      });
      setVisibleTodo(selected);

      if (variant.hasLoadingIndicator) {
        setLoading(false);
        trace.emit({
          kind: "loading_change",
          actor: `loading-${selected}`,
          message: `Loading indicator hidden by response ${selected}.`,
          data: { requestId, selection: selected, loading: false },
        });
      }
    });

    if (!variant.abortOnCleanup) {
      return;
    }

    return () => {
      const wasActive = requests.delete(requestId);
      if (wasActive) {
        handle?.cancel();
      }

      trace.emit({
        kind: "cleanup",
        actor: `effect-${selected}`,
        message: `Cleanup ran for selection ${selected}.`,
        data: { requestId, selection: selected },
      });

      if (wasActive) {
        trace.emit({
          kind: "abort",
          actor: requestId,
          message: `Request ${selected} was aborted before it resolved.`,
          data: { requestId, selection: selected },
        });
      }
    };
  }, [scheduler, selected, trace, variant]);

  return (
    <output
      aria-label="Visible todo"
      data-loading={String(loading)}
      data-selection={visibleTodo ?? "none"}
    >
      {loading
        ? `Loading todo ${selected}…`
        : visibleTodo
          ? `Todo ${visibleTodo}`
          : "No todo loaded"}
    </output>
  );
}
