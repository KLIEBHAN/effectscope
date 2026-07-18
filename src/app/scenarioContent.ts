import type { ScenarioId } from "../domain/trace.js";
import type { ScenarioVariantMap } from "../scenarios/registry.js";

export type Choice = {
  id: string;
  label: string;
  detail: string;
};

export type RepairChoice<Id extends ScenarioId = ScenarioId> = Choice & {
  variantId: ScenarioVariantMap[Id];
  correct: boolean;
};

export type ScenarioContent<Id extends ScenarioId> = {
  id: Id;
  number: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  problem: string;
  invariant: string;
  interaction: string;
  predictions: readonly Choice[];
  repairs: readonly RepairChoice<Id>[];
  bugVariantId: ScenarioVariantMap[Id];
  correctPredictionId: string;
  actualBugOutcome: string;
};

export const scenarioContent: {
  readonly [Id in ScenarioId]: ScenarioContent<Id>;
} = {
  "fetch-race": {
    id: "fetch-race",
    number: "01",
    title: "The late response wins",
    shortTitle: "Fetch race",
    eyebrow: "Async ordering",
    problem:
      "The situation: A slow request for Todo B starts first. Todo C is selected immediately after, and its faster response arrives first.",
    invariant: "Only the latest selected request may write visible state.",
    interaction: "B slow · C fast · 1.2 s controlled run",
    predictions: [
      {
        id: "latest-only",
        label: "Only Todo C remains visible",
        detail: "React knows C is the latest selection and ignores B automatically.",
      },
      {
        id: "stale-overwrite",
        label: "Todo C appears, then B overwrites it",
        detail: "Both callbacks can write; arrival order decides the final state.",
      },
      {
        id: "requests-cancelled",
        label: "Both requests are cancelled",
        detail: "Changing the dependency cancels pending async work by default.",
      },
    ],
    repairs: [
      {
        id: "abort-generation",
        label: "Abort and guard obsolete requests",
        detail: "Cleanup cancels work; a committed generation token closes the passive gap.",
        variantId: "fetch-race/fix-abort-v1",
        correct: true,
      },
      {
        id: "loading-only",
        label: "Add a loading indicator",
        detail: "Show request progress without changing callback ordering.",
        variantId: "fetch-race/distractor-loading-v1",
        correct: false,
      },
    ],
    bugVariantId: "fetch-race/bug-v1",
    correctPredictionId: "stale-overwrite",
    actualBugOutcome: "Todo C appears first. The slower Todo B response then overwrites it.",
  },
  "missing-cleanup": {
    id: "missing-cleanup",
    number: "02",
    title: "The timer that outlived its component",
    shortTitle: "Missing cleanup",
    eyebrow: "Resource lifetime",
    problem:
      "The situation: A component starts an interval, unmounts, then mounts a replacement. The first interval was never cleared.",
    invariant: "Unmounted instances must leave no active timers behind.",
    interaction: "Mount · tick · unmount · remount · tick",
    predictions: [
      {
        id: "one-timer",
        label: "Only the replacement timer runs",
        detail: "React clears timers owned by an unmounted component automatically.",
      },
      {
        id: "two-timers",
        label: "Old and replacement timers both run",
        detail: "The browser interval survives until code explicitly clears it.",
      },
      {
        id: "timer-paused",
        label: "The old timer pauses while unmounted",
        detail: "Remounting resumes the same timer from its previous count.",
      },
    ],
    repairs: [
      {
        id: "clear-interval",
        label: "Clear the interval in cleanup",
        detail: "Return cleanup that stops the exact handle created by this effect.",
        variantId: "missing-cleanup/fix-clear-v1",
        correct: true,
      },
      {
        id: "extra-timer",
        label: "Start a second timer on mount",
        detail: "Add replacement work without stopping the original resource.",
        variantId: "missing-cleanup/distractor-restart-v1",
        correct: false,
      },
    ],
    bugVariantId: "missing-cleanup/bug-v1",
    correctPredictionId: "two-timers",
    actualBugOutcome: "The old interval survives unmount and ticks beside the replacement timer.",
  },
};
