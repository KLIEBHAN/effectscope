import {
  assertValidDelay,
  type ScenarioScheduler,
  type ScheduledHandle,
} from "../domain/scheduler";

type ManualTask = {
  id: number;
  dueAt: number;
  intervalMs: number | null;
  run: () => void;
  active: boolean;
};

export class ManualScheduler implements ScenarioScheduler {
  private clock = 0;
  private nextId = 1;
  private readonly tasks = new Map<number, ManualTask>();
  private disposed = false;

  now = () => this.clock;

  scheduleTimeout(delayMs: number, run: () => void): ScheduledHandle {
    return this.schedule(delayMs, null, run);
  }

  scheduleInterval(intervalMs: number, run: () => void): ScheduledHandle {
    return this.schedule(intervalMs, intervalMs, run);
  }

  advanceBy(durationMs: number): void {
    this.assertActive();
    assertValidDelay(durationMs, true);
    const target = this.clock + durationMs;
    if (!Number.isFinite(target)) {
      throw new Error("Scheduler clock must remain finite.");
    }
    let iterations = 0;

    while (true) {
      const next = [...this.tasks.values()]
        .filter((task) => task.active && task.dueAt <= target)
        .sort((left, right) => left.dueAt - right.dueAt || left.id - right.id)[0];

      if (!next) {
        break;
      }

      if (iterations++ > 10_000) {
        throw new Error("ManualScheduler exceeded its task safety limit.");
      }

      this.clock = next.dueAt;
      if (next.intervalMs === null) {
        next.active = false;
        this.tasks.delete(next.id);
      } else {
        next.dueAt += next.intervalMs;
      }

      next.run();
    }

    this.clock = target;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.tasks.clear();
  }

  private schedule(
    delayMs: number,
    intervalMs: number | null,
    run: () => void,
  ): ScheduledHandle {
    this.assertActive();
    assertValidDelay(delayMs, intervalMs === null);

    const dueAt = this.clock + delayMs;
    if (!Number.isFinite(dueAt)) {
      throw new Error("Scheduled due time must remain finite.");
    }

    const task: ManualTask = {
      id: this.nextId++,
      dueAt,
      intervalMs,
      run,
      active: true,
    };
    this.tasks.set(task.id, task);

    return {
      cancel: () => {
        task.active = false;
        this.tasks.delete(task.id);
      },
    };
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error("Cannot use scheduler after disposal.");
    }
  }
}
