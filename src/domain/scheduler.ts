export type ScheduledHandle = {
  cancel: () => void;
};

export type ScenarioScheduler = {
  now: () => number;
  scheduleTimeout: (delayMs: number, task: () => void) => ScheduledHandle;
  scheduleInterval: (intervalMs: number, task: () => void) => ScheduledHandle;
  dispose: () => void;
};

export function createBrowserScheduler(): ScenarioScheduler {
  const cancellations = new Set<() => void>();

  const register = (cancel: () => void): ScheduledHandle => {
    cancellations.add(cancel);
    return {
      cancel() {
        cancel();
        cancellations.delete(cancel);
      },
    };
  };

  return {
    now: () => performance.now(),
    scheduleTimeout(delayMs, task) {
      const timeoutId = window.setTimeout(() => {
        cancellations.delete(cancel);
        task();
      }, delayMs);
      const cancel = () => window.clearTimeout(timeoutId);
      return register(cancel);
    },
    scheduleInterval(intervalMs, task) {
      const intervalId = window.setInterval(task, intervalMs);
      return register(() => window.clearInterval(intervalId));
    },
    dispose() {
      for (const cancel of cancellations) {
        cancel();
      }
      cancellations.clear();
    },
  };
}
