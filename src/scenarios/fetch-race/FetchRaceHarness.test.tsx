import {
  StrictMode,
  Suspense,
  startTransition,
  useLayoutEffect,
  useState,
} from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { evaluateFetchRace } from "../../domain/invariant";
import { createTraceSession, traceSignature } from "../../domain/trace";
import { ManualScheduler } from "../../test/ManualScheduler";
import { FetchRaceHarness, type TodoSelection } from "./FetchRaceHarness";
import {
  fetchRaceBugOracle,
  fetchRaceDistractorOracle,
  fetchRaceFixOracle,
} from "./oracle";
import type { FetchRaceVariantId } from "./variants";

const schedulers: ManualScheduler[] = [];

afterEach(() => {
  for (const scheduler of schedulers) {
    scheduler.dispose();
  }
  schedulers.length = 0;
});

function createRun(runId: string) {
  const scheduler = new ManualScheduler();
  schedulers.push(scheduler);
  const trace = createTraceSession({
    runId,
    now: scheduler.now,
    evaluate: evaluateFetchRace,
  });
  return { scheduler, trace };
}

function setup(variantId: FetchRaceVariantId) {
  const run = createRun(variantId);
  const view = render(
    <FetchRaceHarness
      runId="run-1"
      selected="B"
      variantId={variantId}
      scheduler={run.scheduler}
      trace={run.trace}
    />,
  );

  view.rerender(
    <FetchRaceHarness
      runId="run-1"
      selected="C"
      variantId={variantId}
      scheduler={run.scheduler}
      trace={run.trace}
    />,
  );

  return { ...run, view };
}

function complete(run: ReturnType<typeof setup>) {
  act(() => run.scheduler.advanceBy(1_200));
  run.scheduler.dispose();
  run.trace.finalize();
}

describe("FetchRaceHarness", () => {
  it("records the stale write produced by the real bug component", () => {
    const run = setup("fetch-race/bug-v1");

    complete(run);

    expect(run.view.getByLabelText("Visible todo")).toHaveTextContent("Todo B");
    expect(traceSignature(run.trace.snapshot())).toEqual(fetchRaceBugOracle);
  });

  it("records cleanup and prevents the old request from writing", () => {
    const run = setup("fetch-race/fix-abort-v1");

    complete(run);

    expect(run.view.getByLabelText("Visible todo")).toHaveTextContent("Todo C");
    expect(traceSignature(run.trace.snapshot())).toEqual(fetchRaceFixOracle);
  });

  it("runs the loading distractor and proves it does not repair the race", () => {
    const run = setup("fetch-race/distractor-loading-v1");

    complete(run);

    expect(run.view.getByLabelText("Visible todo")).toHaveTextContent("Todo B");
    expect(run.view.getByLabelText("Visible todo")).toHaveAttribute(
      "data-loading",
      "false",
    );
    expect(traceSignature(run.trace.snapshot())).toEqual(fetchRaceDistractorOracle);
  });

  it("guards the layout-to-passive cleanup gap with committed generation", () => {
    const { scheduler, trace } = createRun("passive-gap");

    function GapHarness({ selected }: { selected: TodoSelection }) {
      useLayoutEffect(() => {
        if (selected === "C") {
          scheduler.advanceBy(1_200);
        }
      }, [selected]);

      return (
        <FetchRaceHarness
          runId="gap"
          selected={selected}
          variantId="fetch-race/fix-abort-v1"
          scheduler={scheduler}
          trace={trace}
        />
      );
    }

    const view = render(<GapHarness selected="B" />);
    view.rerender(<GapHarness selected="C" />);
    act(() => scheduler.advanceBy(200));
    scheduler.dispose();
    trace.finalize();

    expect(view.getByLabelText("Visible todo")).toHaveTextContent("Todo C");
    expect(trace.snapshot()).toContainEqual(
      expect.objectContaining({ kind: "response_ignored", actor: "request-B-1" }),
    );
    expect(trace.snapshot()).not.toContainEqual(
      expect.objectContaining({ kind: "stale_write" }),
    );
    expect(trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_pass" });
  });

  it("invalidates a fixed request during the layout-to-unmount cleanup gap", () => {
    const { scheduler, trace } = createRun("unmount-gap");

    function GapHarness({ mounted }: { mounted: boolean }) {
      useLayoutEffect(() => {
        if (!mounted) {
          scheduler.advanceBy(1_200);
        }
      }, [mounted]);

      return mounted ? (
        <FetchRaceHarness
          runId="gap"
          selected="B"
          variantId="fetch-race/fix-abort-v1"
          scheduler={scheduler}
          trace={trace}
        />
      ) : null;
    }

    const view = render(<GapHarness mounted />);
    view.rerender(<GapHarness mounted={false} />);
    scheduler.dispose();

    expect(trace.snapshot()).toContainEqual(
      expect.objectContaining({ kind: "response_ignored", actor: "request-B-1" }),
    );
    expect(trace.snapshot()).not.toContainEqual(
      expect.objectContaining({ kind: "state_write" }),
    );
  });

  it("does not mutate committed selection during a suspended transition", () => {
    const { scheduler, trace } = createRun("suspended");
    const never = new Promise<never>(() => undefined);

    function Suspender({ selected }: { selected: TodoSelection }) {
      if (selected === "C") {
        throw never;
      }
      return null;
    }

    function TransitionHarness() {
      const [selected, setSelected] = useState<TodoSelection>("B");
      return (
        <>
          <button
            type="button"
            onClick={() => startTransition(() => setSelected("C"))}
          >
            Select C
          </button>
          <Suspense fallback={<span>Pending</span>}>
            <FetchRaceHarness
              runId="suspended"
              selected={selected}
              variantId="fetch-race/bug-v1"
              scheduler={scheduler}
              trace={trace}
            />
            <Suspender selected={selected} />
          </Suspense>
        </>
      );
    }

    const view = render(<TransitionHarness />);
    fireEvent.click(view.getByRole("button", { name: "Select C" }));
    act(() => scheduler.advanceBy(1_200));
    scheduler.dispose();

    expect(view.getByLabelText("Visible todo")).toHaveTextContent("Todo B");
    expect(trace.snapshot()).toContainEqual(
      expect.objectContaining({ kind: "state_write", actor: "todo-B" }),
    );
    expect(trace.snapshot()).not.toContainEqual(
      expect.objectContaining({ kind: "stale_write" }),
    );
  });

  it("starts a clean trace and visible state for a new run", () => {
    const first = createRun("first");
    const view = render(
      <FetchRaceHarness
        runId="first"
        selected="B"
        variantId="fetch-race/fix-abort-v1"
        scheduler={first.scheduler}
        trace={first.trace}
      />,
    );
    first.scheduler.dispose();

    const second = createRun("second");
    view.rerender(
      <FetchRaceHarness
        runId="second"
        selected="B"
        variantId="fetch-race/fix-abort-v1"
        scheduler={second.scheduler}
        trace={second.trace}
      />,
    );

    expect(second.trace.snapshot().map((event) => event.kind)).toEqual([
      "render",
      "effect_start",
      "async_start",
    ]);
    expect(view.getByLabelText("Visible todo")).toHaveAttribute(
      "data-selection",
      "none",
    );
  });

  it("keeps fixed request lifecycle valid under development Strict Mode", () => {
    const { scheduler, trace } = createRun("strict");
    const view = render(
      <StrictMode>
        <FetchRaceHarness
          runId="strict"
          selected="B"
          variantId="fetch-race/fix-abort-v1"
          scheduler={scheduler}
          trace={trace}
        />
      </StrictMode>,
    );
    view.rerender(
      <StrictMode>
        <FetchRaceHarness
          runId="strict"
          selected="C"
          variantId="fetch-race/fix-abort-v1"
          scheduler={scheduler}
          trace={trace}
        />
      </StrictMode>,
    );

    act(() => scheduler.advanceBy(1_200));
    scheduler.dispose();
    trace.finalize();

    expect(trace.snapshot().filter((event) => event.kind === "render")).toHaveLength(3);
    expect(trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_pass" });
  });
});
