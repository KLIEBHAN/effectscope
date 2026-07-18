import { describe, expect, it, vi } from "vitest";
import { ManualScheduler } from "../test/ManualScheduler";
import { createScenarioRunner } from "./scenarioRunner";

describe("createScenarioRunner", () => {
  it("disposes scheduled work before publishing terminal truth", () => {
    const scheduler = new ManualScheduler();
    const tick = vi.fn();
    scheduler.scheduleInterval(10, tick);
    const runner = createScenarioRunner({
      runId: "run",
      scenarioId: "missing-cleanup",
      variantId: "missing-cleanup/bug-v1",
      scheduler,
    });
    runner.writer.emit({
      kind: "render",
      actor: "one",
      message: "Mounted.",
      data: { instanceId: "one", cycle: 0, mounted: true },
    });

    const terminal = runner.finish();
    const finalLength = runner.trace.snapshot().length;

    expect(terminal).toMatchObject({ kind: "invariant_fail", data: { incomplete: true } });
    expect(runner.writer.emit({ kind: "render", actor: "late", message: "Late." })).toBeNull();
    expect(runner.trace.snapshot()).toHaveLength(finalLength);
    expect(() => scheduler.advanceBy(10)).toThrow(/after disposal/);
    expect(tick).not.toHaveBeenCalled();
    expect(runner.finish()).toBe(terminal);
  });

  it("isolates runner operations and scheduled work from observers", () => {
    const scheduler = new ManualScheduler();
    const tick = vi.fn();
    const observerError = vi.fn();
    scheduler.scheduleInterval(10, tick);
    let runner: ReturnType<typeof createScenarioRunner<"fetch-race">>;
    runner = createScenarioRunner({
      runId: "observed",
      scenarioId: "fetch-race",
      variantId: "fetch-race/bug-v1",
      scheduler,
      onEvent: (event) => {
        if (event.kind === "render") {
          runner.finish();
        }
        if (event.kind === "effect_start") {
          runner.dispose();
        }
        if (event.kind === "invariant_fail") {
          scheduler.advanceBy(10);
        }
      },
      onObserverError: observerError,
    });

    runner.writer.emit({ kind: "render", actor: "B", message: "B." });
    runner.writer.emit({ kind: "effect_start", actor: "effect", message: "Effect." });
    expect(runner.trace.isFinalized()).toBe(false);
    expect(() => scheduler.scheduleTimeout(1, () => undefined)).not.toThrow();

    runner.finish();

    expect(tick).not.toHaveBeenCalled();
    expect(observerError).toHaveBeenCalledTimes(3);
  });

  it("allocates an opaque React key even when callers reuse run IDs", () => {
    const first = createScenarioRunner({
      runId: "reused",
      scenarioId: "fetch-race",
      variantId: "fetch-race/bug-v1",
      scheduler: new ManualScheduler(),
    });
    const second = createScenarioRunner({
      runId: "reused",
      scenarioId: "fetch-race",
      variantId: "fetch-race/bug-v1",
      scheduler: new ManualScheduler(),
    });

    expect(first.runKey).not.toBe(second.runKey);
    first.dispose();
    second.dispose();
  });

  it("cancels an abandoned run without fabricating an invariant verdict", () => {
    const scheduler = new ManualScheduler();
    const runner = createScenarioRunner({
      runId: "cancelled",
      scenarioId: "fetch-race",
      variantId: "fetch-race/bug-v1",
      scheduler,
    });
    runner.writer.emit({ kind: "render", actor: "B", message: "B." });

    runner.dispose();

    expect(runner.trace.snapshot().map((event) => event.kind)).toEqual(["render"]);
    expect(runner.trace.isFinalized()).toBe(false);
    expect(runner.writer.emit({ kind: "render", actor: "late", message: "Late." })).toBeNull();
    expect(() => scheduler.scheduleTimeout(1, () => undefined)).toThrow();
  });

  it("binds one variant to the runner and rejects invalid pairs at runtime", () => {
    const scheduler = new ManualScheduler();

    expect(() =>
      createScenarioRunner({
        runId: "invalid",
        scenarioId: "fetch-race",
        variantId: "missing-cleanup/bug-v1" as never,
        scheduler,
      }),
    ).toThrow(/does not belong/);
    scheduler.dispose();
  });
});
