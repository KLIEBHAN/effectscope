export type ScheduledHandle = {
  cancel: () => void;
};

export type ScenarioScheduler = {
  now: () => number;
  scheduleTimeout: (delayMs: number, task: () => void) => ScheduledHandle;
  scheduleInterval: (intervalMs: number, task: () => void) => ScheduledHandle;
  dispose: () => void;
};

export function assertValidDelay(value: number, allowZero: boolean): void {
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new Error(
      allowZero
        ? "Scheduled delay must be finite and non-negative."
        : "Scheduled interval must be finite and greater than zero.",
    );
  }
}
