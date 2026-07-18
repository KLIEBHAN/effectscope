import type { TraceEvent } from "../../domain/trace";

type CoachPanelProps = {
  events: readonly TraceEvent[];
};

export function CoachPanel({ events }: CoachPanelProps) {
  const terminal = events.at(-1);
  const passed = terminal?.kind === "invariant_pass";
  const failed = terminal?.kind === "invariant_fail";

  return (
    <section className="instrument coach-panel" aria-labelledby="coach-title">
      <div className="instrument__head">
        <div>
          <p className="kicker">Step 05 · Explain</p>
          <h2 id="coach-title">Evidence coach</h2>
        </div>
        <span className="instrument__status">GPT-5.6 ready</span>
      </div>
      {passed || failed ? (
        <div className={passed ? "verdict verdict--pass" : "verdict verdict--fail"}>
          <p className="verdict__label">Deterministic verdict</p>
          <strong>{passed ? "Invariant proved" : "Invariant violated"}</strong>
          <p>
            {terminal.message} Runtime evidence decides this result; model coaching
            will explain your prediction without changing technical truth.
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
