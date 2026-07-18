import type { RefObject } from "react";
import type { PredictionAssessment } from "../../app/predictionFeedback";
import type { TraceEvent } from "../../domain/trace";
import type { AnalyzeAttemptResponse } from "../../infrastructure/feedbackSchema";

export type CoachModelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; response: AnalyzeAttemptResponse };

type CoachPanelProps = {
  actualBugOutcome: string;
  events: readonly TraceEvent[];
  executedVariantLabel: string;
  modelState: CoachModelState;
  onEvidence: (eventId: string) => void;
  onRequest: () => void;
  predictionAssessment: PredictionAssessment;
  predictionLabel: string | null;
  verdictRef: RefObject<HTMLDivElement | null>;
};

export function CoachPanel({
  actualBugOutcome,
  events,
  executedVariantLabel,
  modelState,
  onEvidence,
  onRequest,
  predictionAssessment,
  predictionLabel,
  verdictRef,
}: CoachPanelProps) {
  const terminal = events.findLast(
    (event) => event.kind === "invariant_pass" || event.kind === "invariant_fail",
  );
  const passed = terminal?.kind === "invariant_pass";
  const failed = terminal?.kind === "invariant_fail";
  const modelAnnouncement = modelState.status === "loading"
    ? "GPT-5.6 coaching in progress."
    : modelState.status === "success"
      ? `GPT-5.6 coaching ready. Learning assessment: ${modelState.response.feedback.verdict.replaceAll("_", " ")}.`
      : modelState.status === "error"
        ? `GPT-5.6 coaching failed. ${modelState.message}`
        : "GPT-5.6 coaching is optional.";

  return (
    <section className="instrument coach-panel" aria-labelledby="coach-title">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {modelAnnouncement}
      </p>
      <div className="instrument__head">
        <div>
          <p className="kicker">Step 03 · Observe &amp; explain</p>
          <h2 id="coach-title">Evidence coach</h2>
        </div>
        <span className="instrument__status">
          {modelState.status === "loading"
            ? "GPT-5.6 analyzing"
            : modelState.status === "success"
              ? modelState.response.model
              : modelState.status === "error"
                ? "Deterministic only"
                : "Model coaching optional"}
        </span>
      </div>
      {passed || failed ? (
        <div
          className={passed ? "verdict verdict--pass" : "verdict verdict--fail"}
          ref={verdictRef}
          tabIndex={-1}
        >
          <p className="verdict__label">Deterministic verdict</p>
          <strong>{passed ? "Invariant proved" : "Invariant violated"}</strong>
          <p>{terminal.message}</p>
          {predictionLabel ? (
            <dl className="prediction-feedback">
              <div>
                <dt>Your prediction</dt>
                <dd>{predictionLabel}</dd>
              </div>
              <div>
                <dt>Actual bug behavior</dt>
                <dd>{actualBugOutcome}</dd>
              </div>
              <div>
                <dt>Assessment</dt>
                <dd>
                  {predictionAssessment === "matched"
                    ? "Your prediction matched the observed bug trace."
                    : predictionAssessment === "missed"
                      ? "Your prediction missed the observed bug trace."
                      : "Prediction could not be assessed from this incomplete trace."}
                </dd>
              </div>
              <div>
                <dt>Variant under test</dt>
                <dd>{executedVariantLabel}</dd>
              </div>
            </dl>
          ) : null}
          <p className="truth-note">
            Runtime evidence decides technical truth. Model coaching may explain it,
            never replace it.
          </p>
          <div className="model-coach">
            {modelState.status === "success" ? (
              <div className="model-feedback">
                <div className="model-feedback__head">
                  <span>GPT-5.6 coaching</span>
                  <strong>{modelState.response.feedback.verdict.replaceAll("_", " ")}</strong>
                </div>
                <p>{modelState.response.feedback.misconception}</p>
                <div className="model-evidence" aria-label="Model evidence">
                  {modelState.response.feedback.evidence.map((evidence) => {
                    const event = events.find((candidate) => candidate.id === evidence.eventId);
                    return (
                      <button
                        type="button"
                        key={evidence.eventId}
                        onClick={() => onEvidence(evidence.eventId)}
                      >
                        <span>Event {event?.sequence ?? "?"}</span>
                        {evidence.explanation}
                      </button>
                    );
                  })}
                </div>
                <p><strong>Next hint:</strong> {modelState.response.feedback.hint}</p>
                <div className="transfer-question">
                  <strong>Transfer check</strong>
                  <p>{modelState.response.feedback.transferQuestion.prompt}</p>
                  <ul>
                    {modelState.response.feedback.transferQuestion.options.map((option) => (
                      <li key={option}>{option}</li>
                    ))}
                  </ul>
                </div>
                <button className="button button--quiet" type="button" onClick={onRequest}>
                  Recheck coaching
                </button>
              </div>
            ) : modelState.status === "loading" ? (
              <p className="model-coach__status">GPT-5.6 is grounding feedback in this trace…</p>
            ) : (
              <div>
                {modelState.status === "error" ? (
                  <p className="model-coach__error" role="alert">{modelState.message}</p>
                ) : (
                  <p>Ask GPT-5.6 to explain the observed gap and cite exact trace events.</p>
                )}
                <button className="button button--quiet" type="button" onClick={onRequest}>
                  {modelState.status === "error" ? "Retry GPT-5.6 coach" : "Ask GPT-5.6 coach"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="coach-idle">
          <span aria-hidden>⌁</span>
          <p>Coach unlocks after a complete trace. No model is asked to simulate React.</p>
        </div>
      )}
    </section>
  );
}
