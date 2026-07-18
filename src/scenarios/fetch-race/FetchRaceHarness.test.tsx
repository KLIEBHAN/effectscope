import {
  StrictMode,
  Suspense,
  startTransition,
  useLayoutEffect,
  useState,
} from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createScenarioRunner } from "../../domain/scenarioRunner";
import { traceSignature } from "../../domain/trace";
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

function createRun(runId: string, variantId: FetchRaceVariantId) {
  const scheduler = new ManualScheduler();
  schedulers.push(scheduler);
  const runner = createScenarioRunner({
    runId,
    scenarioId: "fetch-race",
    variantId,
    scheduler,
  });
  return { scheduler, trace: runner.trace, runner };
}

function setup(variantId: FetchRaceVariantId) {
  const run = createRun(variantId, variantId);
  const view = render(
    <FetchRaceHarness
      runner={run.runner}
      selected="B"
    />,
  );

  view.rerender(
    <FetchRaceHarness
      runner={run.runner}
      selected="C"
    />,
  );

  return { ...run, view };
}

function complete(run: ReturnType<typeof setup>) {
  act(() => run.scheduler.advanceBy(1_200));
  run.runner.finish();
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
    const run = createRun("passive-gap", "fetch-race/fix-abort-v1");
    const { scheduler, trace } = run;

    function GapHarness({ selected }: { selected: TodoSelection }) {
      useLayoutEffect(() => {
        if (selected === "C") {
          scheduler.advanceBy(1_200);
        }
      }, [selected]);

      return (
        <FetchRaceHarness
          runner={run.runner}
          selected={selected}
        />
      );
    }

    const view = render(<GapHarness selected="B" />);
    view.rerender(<GapHarness selected="C" />);
    act(() => scheduler.advanceBy(200));
    run.runner.finish();

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
    const run = createRun("unmount-gap", "fetch-race/fix-abort-v1");
    const { scheduler, trace } = run;

    function GapHarness({ mounted }: { mounted: boolean }) {
      useLayoutEffect(() => {
        if (!mounted) {
          scheduler.advanceBy(1_200);
        }
      }, [mounted]);

      return mounted ? (
        <FetchRaceHarness
          runner={run.runner}
          selected="B"
        />
      ) : null;
    }

    const view = render(<GapHarness mounted />);
    view.rerender(<GapHarness mounted={false} />);
    run.runner.dispose();

    expect(trace.snapshot()).toContainEqual(
      expect.objectContaining({ kind: "response_ignored", actor: "request-B-1" }),
    );
    expect(trace.snapshot()).not.toContainEqual(
      expect.objectContaining({ kind: "state_write" }),
    );
  });

  it("does not mutate committed selection during a suspended transition", () => {
    const run = createRun("suspended", "fetch-race/bug-v1");
    const { scheduler, trace } = run;
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
              runner={run.runner}
              selected={selected}
            />
            <Suspender selected={selected} />
          </Suspense>
        </>
      );
    }

    const view = render(<TransitionHarness />);
    fireEvent.click(view.getByRole("button", { name: "Select C" }));
    act(() => scheduler.advanceBy(1_200));
    run.runner.dispose();

    expect(view.getByLabelText("Visible todo")).toHaveTextContent("Todo B");
    expect(trace.snapshot()).toContainEqual(
      expect.objectContaining({ kind: "state_write", actor: "todo-B" }),
    );
    expect(trace.snapshot()).not.toContainEqual(
      expect.objectContaining({ kind: "stale_write" }),
    );
  });

  it("starts a clean trace and visible state for a new run", () => {
    const first = createRun("first", "fetch-race/fix-abort-v1");
    const view = render(
      <FetchRaceHarness
        runner={first.runner}
        selected="B"
      />,
    );
    first.runner.dispose();

    const second = createRun("second", "fetch-race/fix-abort-v1");
    view.rerender(
      <FetchRaceHarness
        runner={second.runner}
        selected="B"
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

  it.each([
    ["fetch-race/bug-v1", "fetch-race/fix-abort-v1", "invariant_pass"],
    ["fetch-race/fix-abort-v1", "fetch-race/bug-v1", "invariant_fail"],
  ] as const)(
    "isolates a %s to %s variant change in a fresh runner",
    (fromVariant, toVariant, terminalKind) => {
      const first = createRun("old-run", fromVariant);
      const view = render(
        <FetchRaceHarness runner={first.runner} selected="B" />,
      );
      first.runner.dispose();

      const second = createRun("new-run", toVariant);
      view.rerender(<FetchRaceHarness runner={second.runner} selected="B" />);
      view.rerender(<FetchRaceHarness runner={second.runner} selected="C" />);
      act(() => second.scheduler.advanceBy(1_200));
      second.runner.finish();

      expect(() => first.scheduler.advanceBy(1_200)).toThrow(/after disposal/);
      expect(second.trace.snapshot().at(-1)).toMatchObject({ kind: terminalKind });
      expect(
        second.trace.snapshot().filter((event) => event.kind === "async_start"),
      ).toHaveLength(2);
    },
  );

  it("keeps fixed request lifecycle valid under development Strict Mode", () => {
    const run = createRun("strict", "fetch-race/fix-abort-v1");
    const { scheduler, trace } = run;
    const view = render(
      <StrictMode>
        <FetchRaceHarness
          runner={run.runner}
          selected="B"
        />
      </StrictMode>,
    );
    view.rerender(
      <StrictMode>
        <FetchRaceHarness
          runner={run.runner}
          selected="C"
        />
      </StrictMode>,
    );

    act(() => scheduler.advanceBy(1_200));
    run.runner.finish();

    expect(trace.snapshot().filter((event) => event.kind === "render")).toHaveLength(3);
    expect(trace.snapshot().at(-1)).toMatchObject({ kind: "invariant_pass" });
  });
});
