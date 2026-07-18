import { describe, expect, it, vi } from "vitest";
import { ManualScheduler } from "../test/ManualScheduler";
import { createScenarioRunner } from "./scenarioRunner";

describe("createScenarioRunner", () => {
  it("disposes scheduled work before finalizing and closes the trace", () => {
    const scheduler = new ManualScheduler();
    const tick = vi.fn();
    scheduler.scheduleInterval(10, tick);
    const runner = createScenarioRunner({
      runId: "run",
      scenarioId: "missing-cleanup",
      scheduler,
    });
    runner.trace.emit({
      kind: "render",
      actor: "one",
      message: "Mounted.",
      data: { instanceId: "one", cycle: 0, mounted: true },
    });

    const terminal = runner.finish();
    const finalLength = runner.trace.snapshot().length;

    expect(terminal).toMatchObject({ kind: "invariant_fail", data: { incomplete: true } });
    expect(runner.trace.emit({ kind: "render", actor: "late", message: "Late." })).toBeNull();
    expect(runner.trace.snapshot()).toHaveLength(finalLength);
    expect(() => scheduler.advanceBy(10)).toThrow(/after disposal/);
    expect(tick).not.toHaveBeenCalled();
    expect(runner.finish()).toBe(terminal);
  });
});
