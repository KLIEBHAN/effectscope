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

  const session = createTraceSession({
    runId,
    now: scheduler.now,
    evaluate: evaluators[scenarioId],
    onEvent,
    onObserverError,
  });
  const trace: TraceReader = Object.freeze({
    isFinalized: session.isFinalized,
    snapshot: session.snapshot,
  });
  const writer: TraceWriter = Object.freeze({ emit: session.emit });

  const finish = () => {
    try {
      return session.finalize();
    } finally {
      scheduler.dispose();
    }
  };

  return Object.freeze({
    runId,
    scenarioId,
    variantId,
    scheduler,
    trace,
    writer,
    finish,
    dispose() {
      scheduler.dispose();
      session.cancel();
    },
  });
}
