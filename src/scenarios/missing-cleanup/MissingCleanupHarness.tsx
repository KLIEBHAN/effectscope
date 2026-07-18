import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ScenarioScheduler, ScheduledHandle } from "../../domain/scheduler";
import type { TraceSession } from "../../domain/trace";
import {
  missingCleanupVariants,
  type MissingCleanupVariantId,
} from "./variants";

type MissingCleanupHarnessProps = {
  mounted: boolean;
  instanceId: string;
  cycle: 0 | 1;
  variantId: MissingCleanupVariantId;
  scheduler: ScenarioScheduler;
  trace: TraceSession;
};

type TimerProbeProps = Omit<MissingCleanupHarnessProps, "mounted">;

export function MissingCleanupHarness({ mounted, ...probeProps }: MissingCleanupHarnessProps) {
  const lastRenderKey = useRef("");
  const renderKey = `${probeProps.instanceId}:${String(mounted)}`;

  useLayoutEffect(() => {
    if (lastRenderKey.current === renderKey) {
      return;
    }

    lastRenderKey.current = renderKey;
    probeProps.trace.emit({
      kind: "render",
      actor: probeProps.instanceId,
      message: mounted
        ? `${probeProps.instanceId} committed as mounted.`
        : `${probeProps.instanceId} committed as unmounted.`,
      data: {
        instanceId: probeProps.instanceId,
        cycle: probeProps.cycle,
        mounted,
      },
    });
  }, [mounted, probeProps.cycle, probeProps.instanceId, probeProps.trace, renderKey]);

  return mounted ? <TimerProbe key={probeProps.instanceId} {...probeProps} /> : null;
}

function TimerProbe({
  instanceId,
  cycle,
  variantId,
  scheduler,
  trace,
}: TimerProbeProps) {
  const variant = missingCleanupVariants[variantId];
  const tickCount = useRef(0);
  const [visibleTicks, setVisibleTicks] = useState(0);

  useEffect(() => {
    const timerActor = `timer-${instanceId}`;
    const handles: ScheduledHandle[] = [];

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

      handles.push(
        scheduler.scheduleInterval(500, () => {
          tickCount.current += 1;
          trace.emit({
            kind: "timer_tick",
            actor,
            message: `${actor} produced tick ${String(tickCount.current)}.`,
            data: { instanceId, cycle, tick: tickCount.current },
          });
          setVisibleTicks((current) => current + 1);
        }),
      );
    };

    startTimer();
    if (variant.startsExtraTimer) {
      startTimer("-extra");
    }

    if (!variant.cleansUp) {
      return;
    }

    return () => {
      trace.emit({
        kind: "cleanup",
        actor: `effect-${instanceId}`,
        message: `Timer effect cleanup ran for ${instanceId}.`,
        data: { instanceId, cycle },
      });
      for (const [index, handle] of handles.entries()) {
        handle.cancel();
        trace.emit({
          kind: "timer_stop",
          actor: `${timerActor}${index === 0 ? "" : "-extra"}`,
          message: `Timer ${String(index + 1)} stopped for ${instanceId}.`,
          data: { instanceId, cycle },
        });
      }
    };
  }, [cycle, instanceId, scheduler, trace, variant.cleansUp, variant.startsExtraTimer]);

  return (
    <output aria-label={`Ticks for ${instanceId}`} data-ticks={visibleTicks}>
      {visibleTicks} ticks
    </output>
  );
}
