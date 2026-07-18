import type { RefObject } from "react";
import type { RepairChoice } from "../../app/scenarioContent";

type RepairPanelProps = {
  choices: readonly RepairChoice[];
  disabled: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  rejected: boolean;
  selectedId: string | null;
  verified: boolean;
  onSelect: (choice: RepairChoice) => void;
  onRun: () => void;
};

export function RepairPanel({
  choices,
  disabled,
  headingRef,
  rejected,
  selectedId,
  verified,
  onSelect,
  onRun,
}: RepairPanelProps) {
  return (
    <section className="instrument repair-panel" aria-labelledby="repair-title">
      <div className="instrument__head">
        <div>
          <p className="kicker">Step 04</p>
          <h2 id="repair-title" ref={headingRef} tabIndex={-1}>Choose the smallest repair</h2>
        </div>
        <span className="instrument__status">
          {verified ? "Verified" : rejected ? "Rejected" : "Hypothesis"}
        </span>
      </div>
      <fieldset className="repair-choices" disabled={disabled}>
        <legend>Repair strategy</legend>
        <div className="choice-list choice-list--repair">
          {choices.map((choice, index) => (
            <label
              className={choice.id === selectedId ? "choice is-selected" : "choice"}
              key={choice.id}
            >
              <input
                type="radio"
                name="repair"
                value={choice.id}
                checked={choice.id === selectedId}
                onChange={() => onSelect(choice)}
              />
              <span className="choice__key">R{String(index + 1)}</span>
              <span>
                <strong>{choice.label}</strong>
                <small>{choice.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        className="button button--primary button--wide"
        type="button"
        disabled={!selectedId || disabled || rejected}
        onClick={onRun}
      >
        {verified
          ? "Retest verified repair"
          : rejected
            ? "Choose another repair"
            : "Test selected repair"}
      </button>
    </section>
  );
}
