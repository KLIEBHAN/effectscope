import { describe, expect, it, vi } from "vitest";
import { ManualScheduler } from "./ManualScheduler";

describe("ManualScheduler", () => {
  it("runs tasks in due-time and insertion order", () => {
    const scheduler = new ManualScheduler();
    const order: string[] = [];

    scheduler.scheduleTimeout(20, () => order.push("later"));
    scheduler.scheduleTimeout(10, () => order.push("first"));
    scheduler.scheduleTimeout(10, () => order.push("second"));
    scheduler.advanceBy(20);

    expect(order).toEqual(["first", "second", "later"]);
    expect(scheduler.now()).toBe(20);
  });

  it("cancels intervals and disposes pending work", () => {
    const scheduler = new ManualScheduler();
    const tick = vi.fn();
    const handle = scheduler.scheduleInterval(5, tick);

    scheduler.advanceBy(10);
    handle.cancel();
    scheduler.advanceBy(10);
    scheduler.scheduleTimeout(5, tick);
    scheduler.dispose();

    expect(tick).toHaveBeenCalledTimes(2);
    expect(() => scheduler.advanceBy(10)).toThrow(/after disposal/);
    expect(() => scheduler.scheduleTimeout(1, tick)).toThrow(/after disposal/);
  });

  it("rejects invalid scheduling values", () => {
    const scheduler = new ManualScheduler();

    expect(() => scheduler.scheduleTimeout(-1, () => undefined)).toThrow();
    expect(() => scheduler.scheduleInterval(0, () => undefined)).toThrow();
    expect(() => scheduler.scheduleTimeout(Number.NaN, () => undefined)).toThrow();
    expect(() => scheduler.advanceBy(-1)).toThrow();
    expect(() => scheduler.advanceBy(Number.NaN)).toThrow();
    expect(scheduler.now()).toBe(0);
  });
});
