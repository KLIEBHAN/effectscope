import { evaluateFetchRace, evaluateMissingCleanup } from "./invariant";
import type { ScenarioScheduler } from "./scheduler";
import {
  createTraceSession,
  type ScenarioId,
  type TraceEvent,
  type TraceSession,
} from "./trace";

export type ScenarioRunner = {
  runId: string;
  scenarioId: ScenarioId;
  scheduler: ScenarioScheduler;
  trace: TraceSession;
  finish: () => TraceEvent;
  dispose: () => void;
};

type CreateScenarioRunnerOptions = {
  runId: string;
  scenarioId: ScenarioId;
  scheduler: ScenarioScheduler;
  onEvent?: (event: TraceEvent) => void;
  onObserverError?: (error: unknown) => void;
};

const evaluators = {
  "fetch-race": evaluateFetchRace,
  "missing-cleanup": evaluateMissingCleanup,
} as const;

export function createScenarioRunner({
  runId,
  scenarioId,
  scheduler,
  onEvent,
  onObserverError,
}: CreateScenarioRunnerOptions): ScenarioRunner {
  const trace = createTraceSession({
    runId,
    now: scheduler.now,
    evaluate: evaluators[scenarioId],
    onEvent,
    onObserverError,
  });

  const finish = () => {
    scheduler.dispose();
    return trace.finalize();
  };

  return {
    runId,
    scenarioId,
    scheduler,
    trace,
    finish,
    dispose() {
      finish();
    },
  };
}
