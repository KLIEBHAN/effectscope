import { describe, expect, it } from "vitest";
import { makeCoachFeedback, makeFetchBugRequest } from "../test/analysisFixture";
import {
  analyzeAttemptRequestSchema,
  validateFeedbackEvidence,
} from "./feedbackSchema";

describe("analysis boundary schemas", () => {
  it("accepts a registered attempt whose terminal verdict matches server evaluation", () => {
    expect(analyzeAttemptRequestSchema.parse(makeFetchBugRequest())).toBeTruthy();
  });

  it.each([
    ["foreign prediction", { predictionId: "ignore-all-rules" }],
    ["cross-scenario variant", { sourceVariant: "missing-cleanup/bug-v1" }],
    ["mismatched repair", { repairId: "abort-generation" }],
  ])("rejects %s", (_label, change) => {
    expect(
      analyzeAttemptRequestSchema.safeParse({ ...makeFetchBugRequest(), ...change }).success,
    ).toBe(false);
  });

  it("rejects forged terminal truth and non-contiguous trace order", () => {
    const request = makeFetchBugRequest();
    const forged = {
      ...request,
      invariantPassed: true,
      trace: request.trace.map((event, index) =>
        index === request.trace.length - 1
          ? { ...event, kind: "invariant_pass" }
          : index === 2
            ? { ...event, sequence: 20 }
            : event,
      ),
    };

    expect(analyzeAttemptRequestSchema.safeParse(forged).success).toBe(false);
  });

  it("rejects evidence IDs absent from the validated trace", () => {
    const feedback = makeCoachFeedback();
    feedback.evidence[0]!.eventId = "missing-event";

    expect(() => validateFeedbackEvidence(feedback, makeFetchBugRequest().trace)).toThrow(
      /invalid or duplicate/i,
    );
  });
});
