import type { RefObject } from "react";
import type { TraceEvent } from "../../domain/trace";

type CoachPanelProps = {
  actualBugOutcome: string;
  events: readonly TraceEvent[];
  executedVariantLabel: string;
  predictionCorrect: boolean;
  predictionLabel: string | null;
  verdictRef: RefObject<HTMLDivElement | null>;
};

export function CoachPanel({
  actualBugOutcome,
  events,
  executedVariantLabel,
  predictionCorrect,
  predictionLabel,
  verdictRef,
}: CoachPanelProps) {
  const terminal = events.findLast(
    (event) => event.kind === "invariant_pass" || event.kind === "invariant_fail",
  );
  const passed = terminal?.kind === "invariant_pass";
  const failed = terminal?.kind === "invariant_fail";

  return (
    <section className="instrument coach-panel" aria-labelledby="coach-title">
      <div className="instrument__head">
        <div>
          <p className="kicker">Step 03 · Observe &amp; explain</p>
          <h2 id="coach-title">Evidence coach</h2>
        </div>
        <span className="instrument__status">Deterministic feedback</span>
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
                  {predictionCorrect
                    ? "Your prediction matched the observed bug trace."
                    : "Your prediction missed the observed bug trace."}
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
