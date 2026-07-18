import { describe, expect, it } from "vitest";
import type { RuntimeTraceEventKind, TraceEvent } from "./trace";
import { evaluateFetchRace, evaluateMissingCleanup } from "./invariant";

function event(
  sequence: number,
  kind: RuntimeTraceEventKind,
  actor: string,
  data?: Record<string, string | number | boolean>,
): TraceEvent {
  return Object.freeze({
    id: `event-${String(sequence)}`,
    sequence,
    atMs: sequence,
    kind,
    actor,
    message: actor,
    data: data ? Object.freeze({ ...data }) : undefined,
  });
}

describe("evaluateFetchRace", () => {
  it("does not pass while an earlier request remains open", () => {
    const result = evaluateFetchRace([
      event(1, "async_start", "B", { requestId: "B" }),
      event(2, "async_start", "X", { requestId: "X" }),
      event(3, "abort", "X", { requestId: "X" }),
      event(4, "async_start", "C", { requestId: "C" }),
      event(5, "async_resolve", "C", { requestId: "C" }),
      event(6, "state_write", "C", { requestId: "C" }),
    ]);

    expect(result.status).toBe("pending");
  });

  it("lets a later stale write override any earlier pass-shaped prefix", () => {
    const result = evaluateFetchRace([
      event(1, "async_start", "B-1", { requestId: "B-1" }),
      event(2, "abort", "B-1", { requestId: "B-1" }),
      event(3, "async_start", "C-1", { requestId: "C-1" }),
      event(4, "async_resolve", "C-1", { requestId: "C-1" }),
      event(5, "state_write", "C-1", { requestId: "C-1" }),
      event(6, "async_start", "B-2", { requestId: "B-2" }),
      event(7, "async_start", "C-2", { requestId: "C-2" }),
      event(8, "async_resolve", "C-2", { requestId: "C-2" }),
      event(9, "state_write", "C-2", { requestId: "C-2" }),
      event(10, "async_resolve", "B-2", { requestId: "B-2" }),
      event(11, "stale_write", "B-2", { requestId: "B-2" }),
    ]);

    expect(result.status).toBe("fail");
  });

  it("allows requests that resolve safely before a later selection starts", () => {
    const result = evaluateFetchRace([
      event(1, "async_start", "B", { requestId: "B" }),
      event(2, "async_resolve", "B", { requestId: "B" }),
      event(3, "state_write", "B", { requestId: "B" }),
      event(4, "async_start", "C", { requestId: "C" }),
      event(5, "async_resolve", "C", { requestId: "C" }),
      event(6, "state_write", "C", { requestId: "C" }),
    ]);

    expect(result.status).toBe("pass");
  });
});

describe("evaluateMissingCleanup", () => {
  it("fails on a tick after owner unmount without requiring remount", () => {
    const result = evaluateMissingCleanup([
      event(1, "render", "one", { instanceId: "one", cycle: 0, mounted: true }),
      event(2, "timer_start", "old", { instanceId: "one", cycle: 0 }),
      event(3, "render", "one", { instanceId: "one", cycle: 0, mounted: false }),
      event(4, "timer_tick", "old", { instanceId: "one", cycle: 0 }),
    ]);

    expect(result.status).toBe("fail");
  });

  it("does not pass when one of two old timers remains active", () => {
    const result = evaluateMissingCleanup([
      event(1, "render", "one", { instanceId: "one", cycle: 0, mounted: true }),
      event(2, "timer_start", "old-a", { instanceId: "one", cycle: 0 }),
      event(3, "timer_start", "old-b", { instanceId: "one", cycle: 0 }),
      event(4, "render", "one", { instanceId: "one", cycle: 0, mounted: false }),
      event(5, "timer_stop", "old-a", { instanceId: "one", cycle: 0 }),
      event(6, "render", "two", { instanceId: "two", cycle: 1, mounted: true }),
      event(7, "timer_start", "new", { instanceId: "two", cycle: 1 }),
      event(8, "timer_tick", "new", { instanceId: "two", cycle: 1 }),
    ]);

    expect(result.status).toBe("fail");
  });
});
