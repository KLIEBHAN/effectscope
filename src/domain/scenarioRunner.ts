import { evaluateFetchRace, evaluateMissingCleanup } from "./invariant";
import type { ScenarioScheduler } from "./scheduler";
import {
  createTraceSession,
  type ScenarioId,
  type TraceEvent,
  type TraceReader,
  type TraceWriter,
} from "./trace";
import {
  isScenarioVariantIdFor,
  type ScenarioVariantMap,
} from "../scenarios/registry";

export type ScenarioRunner<Id extends ScenarioId = ScenarioId> = Readonly<{
  runId: string;
  runKey: string;
  scenarioId: Id;
  variantId: ScenarioVariantMap[Id];
  scheduler: ScenarioScheduler;
  trace: TraceReader;
  writer: TraceWriter;
  finish: () => TraceEvent;
  dispose: () => void;
}>;

type CreateScenarioRunnerOptions<Id extends ScenarioId> = {
  runId: string;
  scenarioId: Id;
  variantId: ScenarioVariantMap[Id];
  scheduler: ScenarioScheduler;
  onEvent?: (event: TraceEvent) => void;
  onObserverError?: (error: unknown) => void;
};

const evaluators = {
  "fetch-race": evaluateFetchRace,
  "missing-cleanup": evaluateMissingCleanup,
} as const;

let nextRunKey = 1;

export function createScenarioRunner<Id extends ScenarioId>({
  runId,
  scenarioId,
  variantId,
  scheduler,
  onEvent,
  onObserverError,
}: CreateScenarioRunnerOptions<Id>): ScenarioRunner<Id> {
  if (!isScenarioVariantIdFor(scenarioId, variantId)) {
    throw new Error(`Variant ${variantId} does not belong to scenario ${scenarioId}.`);
  }

  let observerActive = false;
  const relayEvent = onEvent
    ? (event: TraceEvent) => {
        observerActive = true;
        try {
          onEvent(event);
        } finally {
          observerActive = false;
        }
      }
    : undefined;
  const relayObserverError = onObserverError
    ? (error: unknown) => {
        observerActive = true;
        try {
          onObserverError(error);
        } finally {
          observerActive = false;
        }
      }
    : undefined;
  const session = createTraceSession({
    runId,
    now: scheduler.now,
    evaluate: evaluators[scenarioId],
    onEvent: relayEvent,
    onObserverError: relayObserverError,
  });
  const trace: TraceReader = Object.freeze({
    isFinalized: session.isFinalized,
    snapshot: session.snapshot,
  });
  const writer: TraceWriter = Object.freeze({ emit: session.emit });

  const finish = () => {
    if (observerActive) {
      throw new Error("Scenario observers cannot finish a run.");
    }
    scheduler.dispose();
    return session.finalize();
  };

  const runKey = `effectscope-run-${String(nextRunKey++)}`;

  return Object.freeze({
    runId,
    runKey,
    scenarioId,
    variantId,
    scheduler,
    trace,
    writer,
    finish,
    dispose() {
      if (observerActive) {
        throw new Error("Scenario observers cannot dispose a run.");
      }
      session.cancel();
      scheduler.dispose();
    },
  });
}
