import {
  assertValidDelay,
  type ScenarioScheduler,
  type ScheduledHandle,
} from "../domain/scheduler";
import { createBrowserScheduler } from "./browserScheduler";

type QueuedTimeout = {
  active: boolean;
  delayMs: number;
  task: () => void;
  handle: ScheduledHandle | null;
};

/**
 * Starts the first two request clocks from one epoch. React still decides when
 * each effect starts; main-thread suspension cannot make the slow request's
 * wall-clock timer expire before the fast request has been registered.
 */
export function createAlignedRequestScheduler(): ScenarioScheduler {
  const browser = createBrowserScheduler();
  const queued: QueuedTimeout[] = [];
  let released = false;
  let disposed = false;

  const assertActive = () => {
    if (disposed) {
      throw new Error("Cannot schedule work after aligned scheduler disposal.");
    }
  };

  const release = () => {
    released = true;
    for (const entry of queued) {
      if (entry.active) {
        entry.handle = browser.scheduleTimeout(entry.delayMs, entry.task);
      }
    }
    queued.length = 0;
  };

  return {
    now: browser.now,
    scheduleTimeout(delayMs, task) {
      assertActive();
      assertValidDelay(delayMs, true);
      if (released) {
        return browser.scheduleTimeout(delayMs, task);
      }

      const entry: QueuedTimeout = {
        active: true,
        delayMs,
        task,
        handle: null,
      };
      queued.push(entry);
      if (queued.length === 2) {
        release();
      }

      return {
        cancel() {
          if (!entry.active) return;
          entry.active = false;
          entry.handle?.cancel();
        },
      };
    },
    scheduleInterval(intervalMs, task) {
      assertActive();
      return browser.scheduleInterval(intervalMs, task);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const entry of queued) {
        entry.active = false;
      }
      queued.length = 0;
      browser.dispose();
    },
  };
}
