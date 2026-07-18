import { describe, expect, it, vi } from "vitest";
import { makeCoachFeedback, makeFetchBugRequest } from "../test/analysisFixture";
import { analyzeAttempt, CoachRequestError } from "./analyzeAttempt";

describe("analyzeAttempt", () => {
  it("validates a successful API response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        feedback: makeCoachFeedback(),
        model: "gpt-5.6-terra",
        requestId: "request-1",
      }),
    );

    const result = await analyzeAttempt(makeFetchBugRequest(), { fetcher });

    expect(result.feedback.evidence[0]?.eventId).toBe("run-1-6");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[0]).toBe("/api/analyze");
  });

  it("surfaces bounded server errors without accepting an invalid success body", async () => {
    const unavailable = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ error: "Model coaching is unavailable." }, { status: 503 }),
    );
    await expect(
      analyzeAttempt(makeFetchBugRequest(), { fetcher: unavailable }),
    ).rejects.toThrow("Model coaching is unavailable.");

    const malformed = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ feedback: { verdict: "invented" } }),
    );
    await expect(
      analyzeAttempt(makeFetchBugRequest(), { fetcher: malformed }),
    ).rejects.toBeInstanceOf(CoachRequestError);

    const feedback = makeCoachFeedback();
    feedback.evidence[0]!.eventId = "foreign-event";
    const forgedEvidence = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ feedback, model: "gpt-5.6-terra", requestId: "request-2" }),
    );
    await expect(
      analyzeAttempt(makeFetchBugRequest(), { fetcher: forgedEvidence }),
    ).rejects.toThrow("invalid trace evidence");
  });
});
