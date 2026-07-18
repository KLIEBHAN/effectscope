import type { Choice } from "../../app/scenarioContent";

type PredictionPanelProps = {
  choices: readonly Choice[];
  disabled: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function PredictionPanel({
  choices,
  disabled,
  selectedId,
  onSelect,
}: PredictionPanelProps) {
  return (
    <fieldset className="choice-panel" disabled={disabled}>
      <legend>Predict before running</legend>
      <p className="panel-help">What will the user see after the controlled sequence?</p>
      <div className="choice-list">
        {choices.map((choice, index) => (
          <label
            className={choice.id === selectedId ? "choice is-selected" : "choice"}
            key={choice.id}
          >
            <input
              type="radio"
              name="prediction"
              value={choice.id}
              checked={choice.id === selectedId}
              onChange={() => onSelect(choice.id)}
            />
            <span className="choice__key">{String.fromCharCode(65 + index)}</span>
            <span>
              <strong>{choice.label}</strong>
              <small>{choice.detail}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
