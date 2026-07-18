import type { InvariantEvaluator, InvariantState, TraceEvent } from "./trace";

const pending = (id: string, message: string): InvariantState => ({
  status: "pending",
  id,
  message,
});

const fail = (id: string, message: string): InvariantState => ({
  status: "fail",
  id,
  message,
});

function stringData(event: TraceEvent, key: string): string | null {
  const value = event.data?.[key];
  return typeof value === "string" ? value : null;
}

type RequestState = {
  terminal: "abort" | "resolve" | null;
  disposition: "write" | "ignored" | "stale" | null;
};

export const evaluateFetchRace: InvariantEvaluator = (events) => {
  const id = "latest-request-wins";
  const requests = new Map<string, RequestState>();
  let latestRequestId: string | null = null;

  for (const event of events) {
    const requestId = stringData(event, "requestId");

    if (event.kind === "async_start") {
      if (!requestId || requests.has(requestId)) {
        return fail(id, "Request lifecycle contained a missing or duplicate ID.");
      }
      requests.set(requestId, {
        terminal: null,
        disposition: null,
      });
      latestRequestId = requestId;
      continue;
    }

    if (
      event.kind !== "async_resolve" &&
      event.kind !== "abort" &&
      event.kind !== "state_write" &&
      event.kind !== "stale_write" &&
      event.kind !== "response_ignored"
    ) {
      continue;
    }

    const request = requestId ? requests.get(requestId) : undefined;
    if (!request) {
      return fail(id, "Request lifecycle referenced an unknown request ID.");
    }

    if (event.kind === "async_resolve" || event.kind === "abort") {
      const terminal = event.kind === "abort" ? "abort" : "resolve";
      if (request.terminal) {
        return fail(id, `Request ${requestId} settled more than once.`);
      }
      request.terminal = terminal;
      continue;
    }

    if (request.disposition) {
      return fail(id, `Request ${requestId} produced more than one disposition.`);
    }

    if (request.terminal !== "resolve") {
      return fail(id, `Request ${requestId} wrote before resolving.`);
    }

    if (event.kind === "response_ignored") {
      request.disposition = "ignored";
      continue;
    }

    if (event.kind === "stale_write" || requestId !== latestRequestId) {
      request.disposition = "stale";
      return fail(id, "An older request overwrote the latest selection.");
    }

    request.disposition = "write";
  }

  if (requests.size < 2) {
    return pending(id, "Waiting for both requests to start.");
  }

  const unsettled = [...requests.values()].some((request) => !request.terminal);
  const unresolvedDisposition = [...requests.values()].some(
    (request) => request.terminal === "resolve" && !request.disposition,
  );
  if (unsettled || unresolvedDisposition) {
    return pending(id, "Waiting for every request to settle safely.");
  }

  const latest = latestRequestId ? requests.get(latestRequestId) : undefined;
  if (!latest || latest.terminal !== "resolve" || latest.disposition !== "write") {
    return fail(id, "The latest request did not produce the visible state.");
  }

  return {
    status: "pass",
    id,
    message: "Every request settled and only the latest request updated visible state.",
  };
};

type TimerState = {
  instanceId: string;
  cycle: 0 | 1;
  active: boolean;
};

export const evaluateMissingCleanup: InvariantEvaluator = (events) => {
  const id = "single-active-timer";
  const timers = new Map<string, TimerState>();
  let phase:
    | "await_initial_mount"
    | "initial_mounted"
    | "initial_unmounted"
    | "replacement_mounted"
    | "replacement_unmounted" = "await_initial_mount";
  let initialInstanceId: string | null = null;
  let replacementInstanceId: string | null = null;
  let sawInitialTimer = false;
  let replacementTicked = false;

  for (const event of events) {
    if (event.kind === "render") {
      const instanceId = stringData(event, "instanceId");
      const isMounted = event.data?.mounted;
      const cycle = event.data?.cycle;
      if (!instanceId || typeof isMounted !== "boolean" || (cycle !== 0 && cycle !== 1)) {
        return fail(id, "Render event contained an invalid timer cycle.");
      }

      if (cycle === 0 && isMounted) {
        if (phase === "await_initial_mount") {
          initialInstanceId = instanceId;
          phase = "initial_mounted";
        } else if (phase !== "initial_mounted" || instanceId !== initialInstanceId) {
          return fail(id, "Initial component mounted outside its lifecycle phase.");
        }
      } else if (cycle === 0) {
        if (
          phase === "initial_mounted" &&
          instanceId === initialInstanceId &&
          sawInitialTimer
        ) {
          phase = "initial_unmounted";
        } else if (phase !== "initial_unmounted" || instanceId !== initialInstanceId) {
          return fail(id, "Initial component unmounted outside its lifecycle phase.");
        }
      } else if (isMounted) {
        if (phase === "initial_unmounted") {
          replacementInstanceId = instanceId;
          phase = "replacement_mounted";
        } else if (
          phase !== "replacement_mounted" ||
          instanceId !== replacementInstanceId
        ) {
          return fail(id, "Replacement component mounted outside its lifecycle phase.");
        }
      } else if (
        phase === "replacement_mounted" &&
        instanceId === replacementInstanceId
      ) {
        phase = "replacement_unmounted";
      } else if (
        phase !== "replacement_unmounted" ||
        instanceId !== replacementInstanceId
      ) {
        return fail(id, "Replacement component unmounted outside its lifecycle phase.");
      }
      continue;
    }

    if (
      event.kind !== "timer_start" &&
      event.kind !== "timer_stop" &&
      event.kind !== "timer_tick"
    ) {
      continue;
    }

    const instanceId = stringData(event, "instanceId");
    const cycle = event.data?.cycle;
    if (!instanceId || (cycle !== 0 && cycle !== 1)) {
      return fail(id, "Timer lifecycle event omitted its owner or cycle.");
    }

    if (event.kind === "timer_start") {
      const expectedOwner = cycle === 0 ? initialInstanceId : replacementInstanceId;
      const expectedPhase = cycle === 0 ? "initial_mounted" : "replacement_mounted";
      if (phase !== expectedPhase || instanceId !== expectedOwner) {
        return fail(id, `Timer ${event.actor} started outside a mounted component.`);
      }
      if (timers.has(event.actor)) {
        return fail(id, `Timer ${event.actor} started more than once.`);
      }
      timers.set(event.actor, { instanceId, cycle, active: true });
      sawInitialTimer ||= cycle === 0;
      if ([...timers.values()].filter((timer) => timer.active).length > 1) {
        return fail(id, "More than one timer was active at the same time.");
      }
      continue;
    }

    const timer = timers.get(event.actor);
    if (!timer || timer.instanceId !== instanceId || timer.cycle !== cycle) {
      return fail(id, `Timer ${event.actor} has an invalid lifecycle.`);
    }

    if (event.kind === "timer_stop") {
      if (!timer.active) {
        return fail(id, `Timer ${event.actor} stopped more than once.`);
      }
      timer.active = false;
      continue;
    }

    if (!timer.active) {
      return fail(id, `Stopped timer ${event.actor} produced work.`);
    }
    replacementTicked ||= cycle === 1;
  }

  const activeTimers = [...timers.values()].filter((timer) => timer.active);
  const activeOwner =
    phase === "initial_mounted"
      ? initialInstanceId
      : phase === "replacement_mounted"
        ? replacementInstanceId
        : null;
  if (activeTimers.some((timer) => timer.instanceId !== activeOwner)) {
    return fail(id, "A timer from an unmounted component remained active.");
  }
  if (phase !== "replacement_mounted" && phase !== "replacement_unmounted") {
    return pending(id, "Waiting for a complete mount, unmount, and remount cycle.");
  }
  const oldTimerActive = activeTimers.some((timer) => timer.cycle === 0);
  const replacementTimers = activeTimers.filter((timer) => timer.cycle === 1);

  if (oldTimerActive || replacementTimers.length > 1) {
    return fail(id, "Remount left an invalid set of timers active.");
  }
  const shouldHaveActiveReplacement = phase === "replacement_mounted";
  if (shouldHaveActiveReplacement !== (replacementTimers.length === 1)) {
    return fail(id, "Replacement timer lifecycle does not match component mount state.");
  }
  if (!replacementTicked) {
    return pending(id, "Waiting for the replacement timer to produce work.");
  }

  return {
    status: "pass",
    id,
    message: "The old timer stopped and exactly one replacement timer produced work.",
  };
};
