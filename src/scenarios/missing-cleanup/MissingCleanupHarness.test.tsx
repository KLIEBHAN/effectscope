import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { evaluateMissingCleanup } from "../../domain/invariant";
import { createTraceSession, traceSignature } from "../../domain/trace";
import { ManualScheduler } from "../../test/ManualScheduler";
import { MissingCleanupHarness } from "./MissingCleanupHarness";
import { missingCleanupBugOracle, missingCleanupFixOracle } from "./oracle";

const schedulers: ManualScheduler[] = [];

afterEach(() => {
  for (const scheduler of schedulers) {
    scheduler.dispose();
  }
  schedulers.length = 0;
});

function setup(
  variantId:
    | "missing-cleanup/bug-v1"
    | "missing-cleanup/fix-clear-v1"
    | "missing-cleanup/distractor-restart-v1",
) {
  const scheduler = new ManualScheduler();
  schedulers.push(scheduler);
  const trace = createTraceSession({
    runId: variantId,
    now: scheduler.now,
    evaluate: evaluateMissingCleanup,
  });
  const view = render(
    <MissingCleanupHarness
      mounted
      instanceId="instance-1"
      cycle={0}
      variantId={variantId}
      scheduler={scheduler}
      trace={trace}
    />,
  );

  act(() => scheduler.advanceBy(500));

  view.rerender(
    <MissingCleanupHarness
      mounted={false}
      instanceId="instance-1"
      cycle={0}
      variantId={variantId}
      scheduler={scheduler}
      trace={trace}
    />,
  );
  view.rerender(
    <MissingCleanupHarness
      mounted
      instanceId="instance-2"
      cycle={1}
      variantId={variantId}
      scheduler={scheduler}
      trace={trace}
    />,
  );

  return { scheduler, trace };
}

describe("MissingCleanupHarness", () => {
  it("records both timers continuing after a remount", () => {
    const { scheduler, trace } = setup("missing-cleanup/bug-v1");

    act(() => scheduler.advanceBy(500));

    expect(traceSignature(trace.snapshot())).toEqual(missingCleanupBugOracle);
  });

  it("records cleanup and only the replacement timer tick", () => {
    const { scheduler, trace } = setup("missing-cleanup/fix-clear-v1");

    act(() => scheduler.advanceBy(500));

    expect(traceSignature(trace.snapshot())).toEqual(missingCleanupFixOracle);
  });

  it("proves that starting more timers makes the leak worse", () => {
    const { scheduler, trace } = setup("missing-cleanup/distractor-restart-v1");

    act(() => scheduler.advanceBy(500));

    expect(trace.snapshot().filter((event) => event.kind === "timer_start")).toHaveLength(4);
    expect(trace.snapshot()).toContainEqual(
      expect.objectContaining({
        kind: "invariant_fail",
        actor: "single-active-timer",
      }),
    );
  });
});
