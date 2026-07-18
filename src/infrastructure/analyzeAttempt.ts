import {
  analyzeAttemptRequestSchema,
  analyzeAttemptResponseSchema,
  validateFeedbackEvidence,
  type AnalyzeAttemptRequest,
  type AnalyzeAttemptResponse,
} from "./feedbackSchema";

export class CoachRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoachRequestError";
  }
}

type AnalyzeAttemptOptions = {
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

export async function analyzeAttempt(
  input: AnalyzeAttemptRequest,
  { fetcher = fetch, signal }: AnalyzeAttemptOptions = {},
): Promise<AnalyzeAttemptResponse> {
  const request = analyzeAttemptRequestSchema.parse(input);
  const response = await fetcher("/api/analyze", {
    body: JSON.stringify(request),
    headers: { "content-type": "application/json" },
    method: "POST",
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CoachRequestError("Model coaching returned an unreadable response.");
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body && typeof body.error === "string"
        ? body.error
        : "Model coaching is unavailable. Deterministic evidence remains available.";
    throw new CoachRequestError(message);
  }

  const parsed = analyzeAttemptResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new CoachRequestError("Model coaching returned an invalid response.");
  }
  try {
    validateFeedbackEvidence(parsed.data.feedback, request.trace);
  } catch {
    throw new CoachRequestError("Model coaching cited invalid trace evidence.");
  }
  return parsed.data;
}
