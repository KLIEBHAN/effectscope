import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { evaluateFetchRace } from "../../domain/invariant";
import { createTraceSession, traceSignature } from "../../domain/trace";
import { ManualScheduler } from "../../test/ManualScheduler";
import { FetchRaceHarness } from "./FetchRaceHarness";
import { fetchRaceBugOracle, fetchRaceFixOracle } from "./oracle";

const schedulers: ManualScheduler[] = [];

afterEach(() => {
  for (const scheduler of schedulers) {
    scheduler.dispose();
  }
  schedulers.length = 0;
});

function setup(
  variantId:
    | "fetch-race/bug-v1"
    | "fetch-race/fix-abort-v1"
    | "fetch-race/distractor-loading-v1",
) {
  const scheduler = new ManualScheduler();
  schedulers.push(scheduler);
  const trace = createTraceSession({
    runId: variantId,
    now: scheduler.now,
    evaluate: evaluateFetchRace,
  });
  const view = render(
    <FetchRaceHarness
      selected="B"
      variantId={variantId}
      scheduler={scheduler}
      trace={trace}
    />,
  );

  view.rerender(
    <FetchRaceHarness
      selected="C"
      variantId={variantId}
      scheduler={scheduler}
      trace={trace}
    />,
  );

  return { scheduler, trace, view };
}

describe("FetchRaceHarness", () => {
  it("records the stale write produced by the real bug component", () => {
    const { scheduler, trace, view } = setup("fetch-race/bug-v1");

    act(() => scheduler.advanceBy(1_200));

    expect(view.getByLabelText("Visible todo")).toHaveTextContent("Todo B");
    expect(traceSignature(trace.snapshot())).toEqual(fetchRaceBugOracle);
  });

  it("records cleanup and prevents the old request from writing", () => {
    const { scheduler, trace, view } = setup("fetch-race/fix-abort-v1");

    act(() => scheduler.advanceBy(1_200));

    expect(view.getByLabelText("Visible todo")).toHaveTextContent("Todo C");
    expect(traceSignature(trace.snapshot())).toEqual(fetchRaceFixOracle);
  });

  it("proves that a loading indicator does not repair the race", () => {
    const { scheduler, trace } = setup("fetch-race/distractor-loading-v1");

    act(() => scheduler.advanceBy(1_200));

    expect(trace.snapshot().at(-1)).toMatchObject({
      kind: "invariant_fail",
      actor: "latest-request-wins",
    });
  });
});
