import { describe, expect, it, vi } from "vitest";
import { createTraceSession, type TraceEventInput } from "./trace";

describe("createTraceSession", () => {
  it("freezes input, events, snapshots, and finalizes exactly once", () => {
    const inputData = { selection: "B" };
    const trace = createTraceSession({
      runId: "run",
      now: () => 42,
      evaluate: () => ({ status: "pass", id: "proof", message: "Proved." }),
    });

    trace.emit({ kind: "render", actor: "one", message: "One.", data: inputData });
    inputData.selection = "C";
    const terminal = trace.finalize();

    const firstSnapshot = trace.snapshot();
    const secondSnapshot = trace.snapshot();
    expect(firstSnapshot).not.toBe(secondSnapshot);
    expect(firstSnapshot).toEqual([
      expect.objectContaining({
        id: "run-1",
        sequence: 1,
        atMs: 42,
        kind: "render",
        data: { selection: "B" },
      }),
      expect.objectContaining({ id: "run-2", kind: "invariant_pass" }),
    ]);
    expect(Object.isFrozen(firstSnapshot)).toBe(true);
    expect(Object.isFrozen(firstSnapshot[0])).toBe(true);
    expect(Object.isFrozen(firstSnapshot[0].data)).toBe(true);
    expect(trace.finalize()).toBe(terminal);
    expect(trace.emit({ kind: "cleanup", actor: "late", message: "Late." })).toBeNull();
    expect(trace.snapshot()).toHaveLength(2);
  });

  it("rejects spoofed invariant input at runtime", () => {
    const trace = createTraceSession({
      runId: "run",
      now: () => 0,
      evaluate: () => ({ status: "pass", id: "proof", message: "Proved." }),
    });
    const spoof = {
      kind: "invariant_pass",
      actor: "spoof",
      message: "Spoofed.",
    } as unknown as TraceEventInput;

    expect(() => trace.emit(spoof)).toThrow(/only be emitted/);
    expect(trace.snapshot()).toEqual([]);
  });

  it("isolates throwing and reentrant observers from trace truth", () => {
    let trace: ReturnType<typeof createTraceSession>;
    const observerError = vi.fn();
    const onEvent = vi.fn((event) => {
      if (event.kind === "render") {
        trace.emit({ kind: "effect_start", actor: "nested", message: "Nested." });
        throw new Error("observer failed");
      }
    });
    trace = createTraceSession({
      runId: "run",
      now: () => 0,
      evaluate: () => ({ status: "pass", id: "proof", message: "Proved." }),
      onEvent,
      onObserverError: observerError,
    });

    expect(() => trace.emit({ kind: "render", actor: "root", message: "Root." })).not.toThrow();
    expect(trace.snapshot().map((event) => event.actor)).toEqual(["root", "nested"]);
    expect(observerError).toHaveBeenCalledOnce();
  });

  it("marks an incomplete finalized run as a terminal failure", () => {
    const trace = createTraceSession({
      runId: "run",
      now: () => 0,
      evaluate: () => ({ status: "pending", id: "proof", message: "Waiting." }),
    });

    expect(trace.finalize()).toMatchObject({
      kind: "invariant_fail",
      data: { incomplete: true },
      message: "Run incomplete: Waiting.",
    });
  });
});
