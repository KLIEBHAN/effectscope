import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ScenarioScheduler, ScheduledHandle } from "../../domain/scheduler";
import type { TraceSession } from "../../domain/trace";
import { fetchRaceVariants, type FetchRaceVariantId } from "./variants";

export type TodoSelection = "B" | "C";

type FetchRaceHarnessProps = {
  selected: TodoSelection;
  variantId: FetchRaceVariantId;
  scheduler: ScenarioScheduler;
  trace: TraceSession;
};

const requestDelay: Record<TodoSelection, number> = {
  B: 1_200,
  C: 200,
};

export function FetchRaceHarness({
  selected,
  variantId,
  scheduler,
  trace,
}: FetchRaceHarnessProps) {
  const variant = fetchRaceVariants[variantId];
  const latestSelection = useRef(selected);
  const lastTracedSelection = useRef<TodoSelection | null>(null);
  const activeRequests = useRef(new Set<TodoSelection>());
  const [visibleTodo, setVisibleTodo] = useState<TodoSelection | null>(null);

  latestSelection.current = selected;

  useLayoutEffect(() => {
    if (lastTracedSelection.current === selected) {
      return;
    }

    lastTracedSelection.current = selected;
    trace.emit({
      kind: "render",
      actor: `selection-${selected}`,
      message: `Committed render for selection ${selected}.`,
      data: { selection: selected },
    });
  }, [selected, trace]);

  useEffect(() => {
    const requestActor = `request-${selected}`;
    const isLatest = () => latestSelection.current === selected;
    const requests = activeRequests.current;
    let handle: ScheduledHandle | null = null;

    trace.emit({
      kind: "effect_start",
      actor: `effect-${selected}`,
      message: `Effect started for selection ${selected}.`,
      data: { selection: selected },
    });

    requests.add(selected);
    trace.emit({
      kind: "async_start",
      actor: requestActor,
      message: `Request ${selected} started.`,
      data: { selection: selected, delayMs: requestDelay[selected], latest: true },
    });

    handle = scheduler.scheduleTimeout(requestDelay[selected], () => {
      requests.delete(selected);
      const latest = isLatest();

      trace.emit({
        kind: "async_resolve",
        actor: requestActor,
        message: `Request ${selected} resolved.`,
        data: { selection: selected, latest },
      });
      trace.emit({
        kind: latest ? "state_write" : "stale_write",
        actor: `todo-${selected}`,
        message: latest
          ? `Visible todo updated to ${selected}.`
          : `Stale request ${selected} overwrote the latest selection.`,
        data: { selection: selected, latest },
      });
      setVisibleTodo(selected);
    });

    if (!variant.abortOnCleanup) {
      return;
    }

    return () => {
      trace.emit({
        kind: "cleanup",
        actor: `effect-${selected}`,
        message: `Cleanup ran for selection ${selected}.`,
        data: { selection: selected },
      });

      if (requests.delete(selected)) {
        handle?.cancel();
        trace.emit({
          kind: "abort",
          actor: requestActor,
          message: `Request ${selected} was aborted before it resolved.`,
          data: { selection: selected, latest: isLatest() },
        });
      }
    };
  }, [scheduler, selected, trace, variant.abortOnCleanup]);

  return (
    <output aria-label="Visible todo" data-selection={visibleTodo ?? "none"}>
      {visibleTodo ? `Todo ${visibleTodo}` : "No todo loaded"}
    </output>
  );
}
