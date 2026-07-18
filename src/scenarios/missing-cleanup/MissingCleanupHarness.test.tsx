import { StrictMode, useLayoutEffect } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createScenarioRunner } from "../../domain/scenarioRunner";
import {
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
  variantId: MissingCleanupVariantId,
  observer?: {
    onEvent: (event: TraceEvent) => void;
    onObserverError: (error: unknown) => void;
  },
) {
  const scheduler = new ManualScheduler();
  schedulers.push(scheduler);
  const runner = createScenarioRunner({
    runId,
    scenarioId: "missing-cleanup",
    variantId,
    scheduler,
    ...observer,
  });
  return { scheduler, trace: runner.trace, runner };
}

function setup(variantId: MissingCleanupVariantId) {
  const run = createRun(variantId, variantId);
  const view = render(
    <MissingCleanupHarness
      runner={run.runner}
      mounted
      instanceId="instance-1"
      cycle={0}
    />,
  );

  act(() => run.scheduler.advanceBy(500));
  view.rerender(
    <MissingCleanupHarness
      runner={run.runner}
      mounted={false}
      instanceId="instance-1"
      cycle={0}
    />,
  );
  view.rerender(
    <MissingCleanupHarness
      runner={run.runner}
      mounted
      instanceId="instance-2"
      cycle={1}
    />,
  );

  return { ...run, view };
}

function complete(run: ReturnType<typeof setup>) {
  act(() => run.scheduler.advanceBy(500));
  run.runner.finish();
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
    const run = createRun("unmount-only", "missing-cleanup/bug-v1");
    const { scheduler, trace } = run;
    const view = render(
      <MissingCleanupHarness
        runner={run.runner}
        mounted
        instanceId="instance-1"
        cycle={0}
      />,
    );
    view.rerender(
      <MissingCleanupHarness
        runner={run.runner}
        mounted={false}
        instanceId="instance-1"
        cycle={0}
      />,
    );

    act(() => scheduler.advanceBy(500));
    run.runner.finish();

    expect(trace.snapshot()).toContainEqual(
      expect.objectContaining({ kind: "timer_tick", actor: "timer-instance-1-1" }),
    );
    expect(trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_fail" });
  });

  it("cancels resources before notifying a throwing cleanup observer", () => {
    const observerError = vi.fn();
    const run = createRun("observer", "missing-cleanup/fix-clear-v1", {
      onEvent: (event) => {
        if (event.kind === "cleanup") {
          throw new Error("observer failed");
        }
      },
      onObserverError: observerError,
    });
    const { scheduler, trace } = run;
    const view = render(
      <MissingCleanupHarness
        runner={run.runner}
        mounted
        instanceId="instance-1"
        cycle={0}
      />,
    );
    view.rerender(
      <MissingCleanupHarness
        runner={run.runner}
        mounted={false}
        instanceId="instance-1"
        cycle={0}
      />,
    );

    act(() => scheduler.advanceBy(500));
    run.runner.dispose();

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

  it("passes when the proven replacement timer stops on a second unmount", () => {
    const run = setup("missing-cleanup/fix-clear-v1");
    act(() => run.scheduler.advanceBy(500));
    run.view.rerender(
      <MissingCleanupHarness
        runner={run.runner}
        mounted={false}
        instanceId="instance-2"
        cycle={1}
      />,
    );

    run.runner.finish();

    expect(run.trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_pass" });
    expect(run.trace.snapshot()).toContainEqual(
      expect.objectContaining({ kind: "timer_stop", actor: "timer-instance-2-1" }),
    );
  });

  it("treats a layout-to-passive gap tick as stopped when cleanup follows", () => {
    const run = createRun("cleanup-gap", "missing-cleanup/fix-clear-v1");

    function GapHarness({
      mounted,
      instanceId,
      cycle,
    }: {
      mounted: boolean;
      instanceId: string;
      cycle: 0 | 1;
    }) {
      useLayoutEffect(() => {
        if (!mounted && cycle === 0) {
          run.scheduler.advanceBy(500);
        }
      }, [cycle, mounted]);

      return (
        <MissingCleanupHarness
          runner={run.runner}
          mounted={mounted}
          instanceId={instanceId}
          cycle={cycle}
        />
      );
    }

    const view = render(
      <GapHarness mounted instanceId="instance-1" cycle={0} />,
    );
    act(() => run.scheduler.advanceBy(500));
    view.rerender(
      <GapHarness mounted={false} instanceId="instance-1" cycle={0} />,
    );
    view.rerender(
      <GapHarness mounted instanceId="instance-2" cycle={1} />,
    );
    act(() => run.scheduler.advanceBy(500));
    run.runner.finish();

    const unmountSequence = run.trace
      .snapshot()
      .find((event) => event.kind === "render" && event.data?.mounted === false)
      ?.sequence;
    expect(run.trace.snapshot()).toContainEqual(
      expect.objectContaining({
        kind: "timer_tick",
        actor: "timer-instance-1-1",
        sequence: (unmountSequence ?? 0) + 1,
      }),
    );
    expect(run.trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_pass" });
  });

  it("disposes a leaking variant before a fresh fixed runner starts", () => {
    const first = createRun("old-run", "missing-cleanup/bug-v1");
    const view = render(
      <MissingCleanupHarness
        runner={first.runner}
        mounted
        instanceId="old-instance"
        cycle={0}
      />,
    );
    first.runner.dispose();

    const second = createRun("new-run", "missing-cleanup/fix-clear-v1");
    view.rerender(
      <MissingCleanupHarness
        runner={second.runner}
        mounted
        instanceId="instance-1"
        cycle={0}
      />,
    );
    act(() => second.scheduler.advanceBy(500));
    view.rerender(
      <MissingCleanupHarness
        runner={second.runner}
        mounted={false}
        instanceId="instance-1"
        cycle={0}
      />,
    );
    view.rerender(
      <MissingCleanupHarness
        runner={second.runner}
        mounted
        instanceId="instance-2"
        cycle={1}
      />,
    );
    act(() => second.scheduler.advanceBy(500));
    second.runner.finish();

    expect(() => first.scheduler.advanceBy(500)).toThrow(/after disposal/);
    expect(second.trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_pass" });
    expect(second.trace.snapshot().filter((event) => event.kind === "timer_start")).toHaveLength(2);
  });

  it("isolates a fixed-to-bug change in a fresh runner", () => {
    const first = createRun("old-run", "missing-cleanup/fix-clear-v1");
    const view = render(
      <MissingCleanupHarness
        runner={first.runner}
        mounted
        instanceId="old-instance"
        cycle={0}
      />,
    );
    first.runner.dispose();

    const second = createRun("new-run", "missing-cleanup/bug-v1");
    view.rerender(
      <MissingCleanupHarness
        runner={second.runner}
        mounted
        instanceId="instance-1"
        cycle={0}
      />,
    );
    act(() => second.scheduler.advanceBy(500));
    view.rerender(
      <MissingCleanupHarness
        runner={second.runner}
        mounted={false}
        instanceId="instance-1"
        cycle={0}
      />,
    );
    view.rerender(
      <MissingCleanupHarness
        runner={second.runner}
        mounted
        instanceId="instance-2"
        cycle={1}
      />,
    );
    act(() => second.scheduler.advanceBy(500));
    second.runner.finish();

    expect(() => first.scheduler.advanceBy(500)).toThrow(/after disposal/);
    expect(second.trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_fail" });
    expect(second.trace.snapshot().filter((event) => event.kind === "timer_start")).toHaveLength(2);
  });

  it("keeps fixed timer lifecycle valid under development Strict Mode", () => {
    const run = createRun("strict", "missing-cleanup/fix-clear-v1");
    const { scheduler, trace } = run;
    const view = render(
      <StrictMode>
        <MissingCleanupHarness
          runner={run.runner}
          mounted
          instanceId="instance-1"
          cycle={0}
        />
      </StrictMode>,
    );
    act(() => scheduler.advanceBy(500));
    view.rerender(
      <StrictMode>
        <MissingCleanupHarness
          runner={run.runner}
          mounted={false}
          instanceId="instance-1"
          cycle={0}
        />
      </StrictMode>,
    );
    view.rerender(
      <StrictMode>
        <MissingCleanupHarness
          runner={run.runner}
          mounted
          instanceId="instance-2"
          cycle={1}
        />
      </StrictMode>,
    );

    act(() => scheduler.advanceBy(500));
    run.runner.finish();

    expect(trace.snapshot().filter((event) => event.kind === "render").length).toBeGreaterThan(3);
    expect(trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_pass" });
  });
});
