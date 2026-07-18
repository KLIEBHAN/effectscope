import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ScenarioScheduler, ScheduledHandle } from "../../domain/scheduler";
import type { TraceSession } from "../../domain/trace";
import {
  missingCleanupVariants,
  type MissingCleanupVariantId,
} from "./variants";

type MissingCleanupHarnessProps = {
  /** New run IDs require a fresh scheduler and trace; variant changes start a new run. */
  runId: string;
  mounted: boolean;
  instanceId: string;
  cycle: 0 | 1;
  variantId: MissingCleanupVariantId;
  scheduler: ScenarioScheduler;
  trace: TraceSession;
};

type MissingCleanupRunProps = Omit<MissingCleanupHarnessProps, "runId">;
type TimerProbeProps = Omit<MissingCleanupRunProps, "mounted">;

export function MissingCleanupHarness({
  runId,
  variantId,
  ...runProps
}: MissingCleanupHarnessProps) {
  return (
    <MissingCleanupRun
      key={`${runId}:${variantId}`}
      {...runProps}
      variantId={variantId}
    />
  );
}

function MissingCleanupRun({
  mounted,
  instanceId,
  cycle,
  variantId,
  scheduler,
  trace,
}: MissingCleanupRunProps) {
  useLayoutEffect(() => {
    trace.emit({
      kind: "render",
      actor: instanceId,
      message: mounted
        ? `${instanceId} committed as mounted.`
        : `${instanceId} committed as unmounted.`,
      data: { instanceId, cycle, mounted },
    });
  }, [cycle, instanceId, mounted, trace]);

  return mounted ? (
    <TimerProbe
      cycle={cycle}
      instanceId={instanceId}
      scheduler={scheduler}
      trace={trace}
      variantId={variantId}
    />
  ) : null;
}

function TimerProbe({
  instanceId,
  cycle,
  variantId,
  scheduler,
  trace,
}: TimerProbeProps) {
  const variant = missingCleanupVariants[variantId];
  const effectSequence = useRef(0);
  const tickCount = useRef(0);
  const [visibleTicks, setVisibleTicks] = useState(0);

  useEffect(() => {
    const effectRun = ++effectSequence.current;
    const timerActor = `timer-${instanceId}-${String(effectRun)}`;
    const handles: Array<{ actor: string; handle: ScheduledHandle }> = [];

    trace.emit({
      kind: "effect_start",
      actor: `effect-${instanceId}`,
      message: `Timer effect started for ${instanceId}.`,
      data: { instanceId, cycle },
    });

    const startTimer = (suffix = "") => {
      const actor = `${timerActor}${suffix}`;
      trace.emit({
        kind: "timer_start",
        actor,
        message: `${actor} started.`,
        data: { instanceId, cycle },
      });

      const handle = scheduler.scheduleInterval(500, () => {
        tickCount.current += 1;
        trace.emit({
          kind: "timer_tick",
          actor,
          message: `${actor} produced tick ${String(tickCount.current)}.`,
          data: { instanceId, cycle, tick: tickCount.current },
        });
        setVisibleTicks((current) => current + 1);
      });
      handles.push({ actor, handle });
    };

    startTimer();
    if (variant.startsExtraTimer) {
      startTimer("-extra");
    }

    if (!variant.cleansUp) {
      return;
    }

    return () => {
      for (const { handle } of handles) {
        handle.cancel();
      }

      trace.emit({
        kind: "cleanup",
        actor: `effect-${instanceId}`,
        message: `Timer effect cleanup ran for ${instanceId}.`,
        data: { instanceId, cycle },
      });
      for (const { actor } of handles) {
        trace.emit({
          kind: "timer_stop",
          actor,
          message: `${actor} stopped.`,
          data: { instanceId, cycle },
        });
      }
    };
  }, [cycle, instanceId, scheduler, trace, variant]);

  return (
    <output aria-label={`Ticks for ${instanceId}`} data-ticks={visibleTicks}>
      {visibleTicks} ticks
    </output>
  );
}
