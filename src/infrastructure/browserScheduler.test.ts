import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserScheduler } from "./browserScheduler";

afterEach(() => {
  vi.useRealTimers();
});

describe("createBrowserScheduler", () => {
  it("cancels handles and disposes all remaining browser work", () => {
    vi.useFakeTimers();
    const scheduler = createBrowserScheduler();
    const timeout = vi.fn();
    const interval = vi.fn();
    const timeoutHandle = scheduler.scheduleTimeout(10, timeout);
    scheduler.scheduleInterval(5, interval);

    timeoutHandle.cancel();
    vi.advanceTimersByTime(5);
    scheduler.dispose();
    vi.advanceTimersByTime(20);

    expect(timeout).not.toHaveBeenCalled();
    expect(interval).toHaveBeenCalledOnce();
    expect(() => scheduler.scheduleTimeout(1, timeout)).toThrow(/after scheduler disposal/);
  });

  it("validates timeout and interval values consistently", () => {
    const scheduler = createBrowserScheduler();

    expect(() => scheduler.scheduleTimeout(Number.NaN, () => undefined)).toThrow();
    expect(() => scheduler.scheduleInterval(0, () => undefined)).toThrow();
    expect(() => scheduler.scheduleInterval(-1, () => undefined)).toThrow();
    scheduler.dispose();
  });
});
