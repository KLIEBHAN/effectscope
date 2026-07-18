import type { InvariantEvaluator, InvariantState, TraceEvent } from "./trace";

const pending = (id: string, message: string): InvariantState => ({
  status: "pending",
  id,
  message,
});

export const evaluateFetchRace: InvariantEvaluator = (events) => {
  const id = "latest-request-wins";

  if (events.some((event) => event.kind === "stale_write")) {
    return {
      status: "fail",
      id,
      message: "An older request overwrote the latest selection.",
    };
  }

  const latestWrite = events.find(
    (event) => event.kind === "state_write" && event.data?.latest === true,
  );
  const earlierAbort = events.find(
    (event) => event.kind === "abort" && event.data?.latest === false,
  );

  if (latestWrite && earlierAbort) {
    return {
      status: "pass",
      id,
      message: "Only the latest request was allowed to update visible state.",
    };
  }

  return pending(id, "Waiting for all relevant requests to settle.");
};

function timerOwner(event: TraceEvent): string | null {
  const owner = event.data?.instanceId;
  return typeof owner === "string" ? owner : null;
}

export const evaluateMissingCleanup: InvariantEvaluator = (events) => {
  const id = "single-active-timer";
  const secondTimerStart = events.findIndex(
    (event) => event.kind === "timer_start" && event.data?.cycle === 1,
  );

  if (secondTimerStart === -1) {
    return pending(id, "Waiting for the remounted component.");
  }

  const beforeSecondTimer = events.slice(0, secondTimerStart);
  const firstTimerStopped = beforeSecondTimer.some(
    (event) => event.kind === "timer_stop" && event.data?.cycle === 0,
  );
  const ticksAfterRemount = events
    .slice(secondTimerStart + 1)
    .filter((event) => event.kind === "timer_tick");
  const tickingOwners = new Set(ticksAfterRemount.map(timerOwner).filter(Boolean));

  if (tickingOwners.size > 1) {
    return {
      status: "fail",
      id,
      message: "A timer from the unmounted component kept running after remount.",
    };
  }

  if (
    firstTimerStopped &&
    ticksAfterRemount.some((event) => event.data?.cycle === 1)
  ) {
    return {
      status: "pass",
      id,
      message: "The old timer stopped before the replacement timer produced work.",
    };
  }

  return pending(id, "Waiting for a post-remount timer tick.");
};
