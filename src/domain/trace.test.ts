import { describe, expect, it, vi } from "vitest";
import { createTraceSession } from "./trace";

describe("createTraceSession", () => {
  it("emits one terminal invariant event and exposes a readonly snapshot", () => {
    const onEvent = vi.fn();
    const trace = createTraceSession({
      runId: "run",
      now: () => 42,
      onEvent,
      evaluate: (events) =>
        events.length >= 2
          ? { status: "pass", id: "proof", message: "Proved." }
          : { status: "pending", id: "proof", message: "Waiting." },
    });

    trace.emit({ kind: "render", actor: "one", message: "One." });
    trace.emit({ kind: "effect_start", actor: "two", message: "Two." });
    trace.emit({ kind: "cleanup", actor: "three", message: "Three." });

    expect(trace.snapshot()).toEqual([
      expect.objectContaining({ id: "run-1", sequence: 1, atMs: 42, kind: "render" }),
      expect.objectContaining({ id: "run-2", sequence: 2, kind: "effect_start" }),
      expect.objectContaining({ id: "run-3", sequence: 3, kind: "invariant_pass" }),
      expect.objectContaining({ id: "run-4", sequence: 4, kind: "cleanup" }),
    ]);
    expect(onEvent).toHaveBeenCalledTimes(4);
  });
});
