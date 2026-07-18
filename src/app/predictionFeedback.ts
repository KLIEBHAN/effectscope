import type { ScenarioId, TraceEvent } from "../domain/trace";

export type PredictionFeedback = Readonly<{
  actualOutcome: string;
  correctPredictionId: string | null;
}>;

export type PredictionAssessment = "matched" | "missed" | "indeterminate";

export function assessPrediction(
  predictionId: string | null,
  feedback: PredictionFeedback,
): PredictionAssessment {
  if (!predictionId || feedback.correctPredictionId === null) {
    return "indeterminate";
  }
  return predictionId === feedback.correctPredictionId ? "matched" : "missed";
}

export function derivePredictionFeedback(
  scenarioId: ScenarioId,
  events: readonly TraceEvent[],
): PredictionFeedback {
  if (scenarioId === "fetch-race") {
    const cWrite = events.find(
      (event) => event.kind === "state_write" && event.data?.selection === "C",
    );
    const bStaleWrite = events.find(
      (event) => event.kind === "stale_write" && event.data?.selection === "B",
    );
    if (cWrite && bStaleWrite && cWrite.sequence < bStaleWrite.sequence) {
      return {
        actualOutcome: "Todo C appears first. The slower Todo B response then overwrites it.",
        correctPredictionId: "stale-overwrite",
      };
    }
    return {
      actualOutcome:
        "The controlled C-before-B write sequence was not observed; inspect the trace before drawing a conclusion.",
      correctPredictionId: null,
    };
  }

  const initialTick = events.some(
    (event) => event.kind === "timer_tick" && event.data?.cycle === 0,
  );
  const replacementTick = events.some(
    (event) => event.kind === "timer_tick" && event.data?.cycle === 1,
  );
  if (initialTick && replacementTick) {
    return {
      actualOutcome: "The old interval survives unmount and ticks beside the replacement timer.",
      correctPredictionId: "two-timers",
    };
  }
  return {
    actualOutcome:
      "The complete old-and-replacement timer sequence was not observed; inspect the trace before drawing a conclusion.",
    correctPredictionId: null,
  };
}
