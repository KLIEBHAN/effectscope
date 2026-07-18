import { afterEach, describe, expect, it, vi } from "vitest";
import { createAlignedRequestScheduler } from "./alignedRequestScheduler";

afterEach(() => {
  vi.useRealTimers();
});

describe("createAlignedRequestScheduler", () => {
  it("preserves fast-before-slow ordering after the first request waits behind a stall", () => {
    vi.useFakeTimers();
    const scheduler = createAlignedRequestScheduler();
    const events: string[] = [];

    scheduler.scheduleTimeout(1_200, () => events.push("slow-B"));
    vi.advanceTimersByTime(1_600);
    expect(events).toEqual([]);

    scheduler.scheduleTimeout(200, () => events.push("fast-C"));
    vi.advanceTimersByTime(200);
    expect(events).toEqual(["fast-C"]);
    vi.advanceTimersByTime(1_000);
    expect(events).toEqual(["fast-C", "slow-B"]);
  });

  it("honors cancellation before releasing the shared epoch", () => {
    vi.useFakeTimers();
    const scheduler = createAlignedRequestScheduler();
    const events: string[] = [];

    const slow = scheduler.scheduleTimeout(1_200, () => events.push("slow-B"));
    slow.cancel();
    scheduler.scheduleTimeout(200, () => events.push("fast-C"));
    vi.advanceTimersByTime(1_500);

    expect(events).toEqual(["fast-C"]);
  });
});
