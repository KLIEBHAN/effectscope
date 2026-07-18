import {
  assertValidDelay,
  type ScenarioScheduler,
  type ScheduledHandle,
} from "../domain/scheduler";

export function createBrowserScheduler(): ScenarioScheduler {
  const cancellations = new Set<() => void>();
  let disposed = false;

  const assertActive = () => {
    if (disposed) {
      throw new Error("Cannot schedule work after scheduler disposal.");
    }
  };

  const register = (cancelTask: () => void): ScheduledHandle => {
    let active = true;
    const cancel = () => {
      if (!active) {
        return;
      }
      active = false;
      cancelTask();
      cancellations.delete(cancel);
    };
    cancellations.add(cancel);
    return { cancel };
  };

  return {
    now: () => performance.now(),
    scheduleTimeout(delayMs, task) {
      assertActive();
      assertValidDelay(delayMs, true);
      let handle: ScheduledHandle;
      const timeoutId = window.setTimeout(() => {
        handle.cancel();
        task();
      }, delayMs);
      handle = register(() => window.clearTimeout(timeoutId));
      return handle;
    },
    scheduleInterval(intervalMs, task) {
      assertActive();
      assertValidDelay(intervalMs, false);
      const intervalId = window.setInterval(task, intervalMs);
      return register(() => window.clearInterval(intervalId));
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const cancel of [...cancellations]) {
        cancel();
      }
    },
  };
}
