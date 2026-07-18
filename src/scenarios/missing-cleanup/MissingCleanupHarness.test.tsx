import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { evaluateMissingCleanup } from "../../domain/invariant";
import {
  createTraceSession,
  traceSignature,
  type TraceEvent,
} from "../../domain/trace";
import { ManualScheduler } from "../../test/ManualScheduler";
import { MissingCleanupHarness } from "./MissingCleanupHarness";
import {
  missingCleanupBugOracle,
  missingCleanupDistractorOracle,
  missingCleanupFixOracle,
} from "./oracle";
import type { MissingCleanupVariantId } from "./variants";

const schedulers: ManualScheduler[] = [];

afterEach(() => {
  for (const scheduler of schedulers) {
    scheduler.dispose();
  }
  schedulers.length = 0;
});

function createRun(
  runId: string,
  observer?: {
    onEvent: (event: TraceEvent) => void;
    onObserverError: (error: unknown) => void;
  },
) {
  const scheduler = new ManualScheduler();
  schedulers.push(scheduler);
  const trace = createTraceSession({
    runId,
    now: scheduler.now,
    evaluate: evaluateMissingCleanup,
    ...observer,
  });
  return { scheduler, trace };
}

function setup(variantId: MissingCleanupVariantId) {
  const run = createRun(variantId);
  const view = render(
    <MissingCleanupHarness
      runId="run-1"
      mounted
      instanceId="instance-1"
      cycle={0}
      variantId={variantId}
      scheduler={run.scheduler}
      trace={run.trace}
    />,
  );

  act(() => run.scheduler.advanceBy(500));
  view.rerender(
    <MissingCleanupHarness
      runId="run-1"
      mounted={false}
      instanceId="instance-1"
      cycle={0}
      variantId={variantId}
      scheduler={run.scheduler}
      trace={run.trace}
    />,
  );
  view.rerender(
    <MissingCleanupHarness
      runId="run-1"
      mounted
      instanceId="instance-2"
      cycle={1}
      variantId={variantId}
      scheduler={run.scheduler}
      trace={run.trace}
    />,
  );

  return { ...run, view };
}

function complete(run: ReturnType<typeof setup>) {
  act(() => run.scheduler.advanceBy(500));
  run.scheduler.dispose();
  run.trace.finalize();
}

describe("MissingCleanupHarness", () => {
  it("records both timers continuing after a remount", () => {
    const run = setup("missing-cleanup/bug-v1");

    complete(run);

    expect(traceSignature(run.trace.snapshot())).toEqual(missingCleanupBugOracle);
  });

  it("records cleanup and only the replacement timer tick", () => {
    const run = setup("missing-cleanup/fix-clear-v1");

    complete(run);

    expect(traceSignature(run.trace.snapshot())).toEqual(missingCleanupFixOracle);
  });

  it("records an exact Golden Trace for the extra-timer distractor", () => {
    const run = setup("missing-cleanup/distractor-restart-v1");

    complete(run);

    expect(traceSignature(run.trace.snapshot())).toEqual(
      missingCleanupDistractorOracle,
    );
  });

  it("fails when an unmounted timer ticks even without a remount", () => {
    const { scheduler, trace } = createRun("unmount-only");
    const view = render(
      <MissingCleanupHarness
        runId="unmount-only"
        mounted
        instanceId="instance-1"
        cycle={0}
        variantId="missing-cleanup/bug-v1"
        scheduler={scheduler}
        trace={trace}
      />,
    );
    view.rerender(
      <MissingCleanupHarness
        runId="unmount-only"
        mounted={false}
        instanceId="instance-1"
        cycle={0}
        variantId="missing-cleanup/bug-v1"
        scheduler={scheduler}
        trace={trace}
      />,
    );

    act(() => scheduler.advanceBy(500));
    scheduler.dispose();
    trace.finalize();

    expect(trace.snapshot()).toContainEqual(
      expect.objectContaining({ kind: "timer_tick", actor: "timer-instance-1-1" }),
    );
    expect(trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_fail" });
  });

  it("cancels resources before notifying a throwing cleanup observer", () => {
    const observerError = vi.fn();
    const { scheduler, trace } = createRun("observer", {
      onEvent: (event) => {
        if (event.kind === "cleanup") {
          throw new Error("observer failed");
        }
      },
      onObserverError: observerError,
    });
    const view = render(
      <MissingCleanupHarness
        runId="observer"
        mounted
        instanceId="instance-1"
        cycle={0}
        variantId="missing-cleanup/fix-clear-v1"
        scheduler={scheduler}
        trace={trace}
      />,
    );
    view.rerender(
      <MissingCleanupHarness
        runId="observer"
        mounted={false}
        instanceId="instance-1"
        cycle={0}
        variantId="missing-cleanup/fix-clear-v1"
        scheduler={scheduler}
        trace={trace}
      />,
    );

    act(() => scheduler.advanceBy(500));
    scheduler.dispose();

    expect(trace.snapshot().filter((event) => event.kind === "timer_tick")).toHaveLength(0);
    expect(observerError).toHaveBeenCalled();
  });

  it("does not grow a finalized trace during later unmount work", () => {
    const run = setup("missing-cleanup/bug-v1");
    complete(run);
    const finalLength = run.trace.snapshot().length;

    run.view.unmount();

    expect(run.trace.snapshot()).toHaveLength(finalLength);
    expect(run.trace.isFinalized()).toBe(true);
  });

  it("keeps fixed timer lifecycle valid under development Strict Mode", () => {
    const { scheduler, trace } = createRun("strict");
    const view = render(
      <StrictMode>
        <MissingCleanupHarness
          runId="strict"
          mounted
          instanceId="instance-1"
          cycle={0}
          variantId="missing-cleanup/fix-clear-v1"
          scheduler={scheduler}
          trace={trace}
        />
      </StrictMode>,
    );
    act(() => scheduler.advanceBy(500));
    view.rerender(
      <StrictMode>
        <MissingCleanupHarness
          runId="strict"
          mounted={false}
          instanceId="instance-1"
          cycle={0}
          variantId="missing-cleanup/fix-clear-v1"
          scheduler={scheduler}
          trace={trace}
        />
      </StrictMode>,
    );
    view.rerender(
      <StrictMode>
        <MissingCleanupHarness
          runId="strict"
          mounted
          instanceId="instance-2"
          cycle={1}
          variantId="missing-cleanup/fix-clear-v1"
          scheduler={scheduler}
          trace={trace}
        />
      </StrictMode>,
    );

    act(() => scheduler.advanceBy(500));
    scheduler.dispose();
    trace.finalize();

    expect(trace.snapshot().filter((event) => event.kind === "render").length).toBeGreaterThan(3);
    expect(trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_pass" });
  });
});
