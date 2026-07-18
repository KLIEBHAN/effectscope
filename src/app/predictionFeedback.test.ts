import { describe, expect, it } from "vitest";
import type { TraceEvent, TraceEventKind } from "../domain/trace";
import { assessPrediction, derivePredictionFeedback } from "./predictionFeedback";

function event(
  sequence: number,
  kind: TraceEventKind,
  data?: TraceEvent["data"],
): TraceEvent {
  return {
    id: `event-${String(sequence)}`,
    sequence,
    atMs: sequence,
    kind,
    actor: kind,
    message: kind,
    data,
  };
}

describe("derivePredictionFeedback", () => {
  it("matches Fetch Race only when C visibly writes before stale B", () => {
    const observed = derivePredictionFeedback("fetch-race", [
      event(1, "state_write", { selection: "C" }),
      event(2, "stale_write", { selection: "B" }),
    ]);
    const incomplete = derivePredictionFeedback("fetch-race", [
      event(1, "stale_write", { selection: "B" }),
    ]);

    expect(observed.correctPredictionId).toBe("stale-overwrite");
    expect(observed.actualOutcome).toContain("Todo C appears first");
    expect(incomplete.correctPredictionId).toBeNull();
    expect(incomplete.actualOutcome).toContain("not observed");
    expect(assessPrediction("stale-overwrite", observed)).toBe("matched");
    expect(assessPrediction("stale-overwrite", incomplete)).toBe("indeterminate");
  });

  it("matches Missing Cleanup only after both timer generations tick", () => {
    const observed = derivePredictionFeedback("missing-cleanup", [
      event(1, "timer_tick", { cycle: 0 }),
      event(2, "timer_tick", { cycle: 1 }),
    ]);
    const incomplete = derivePredictionFeedback("missing-cleanup", [
      event(1, "timer_tick", { cycle: 0 }),
    ]);

    expect(observed.correctPredictionId).toBe("two-timers");
    expect(observed.actualOutcome).toContain("survives unmount");
    expect(incomplete.correctPredictionId).toBeNull();
    expect(incomplete.actualOutcome).toContain("not observed");
    expect(assessPrediction("one-timer", observed)).toBe("missed");
  });
});
