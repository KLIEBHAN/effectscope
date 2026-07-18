import type { LogEntry } from "../types";
import "./EffectLog.css";

const labels: Record<LogEntry["kind"], string> = {
  effect: "EFFECT",
  cleanup: "CLEANUP",
  render: "RENDER",
  info: "INFO",
  warn: "WARN",
};

type Props = {
  entries: LogEntry[];
  onClear: () => void;
  hint?: string;
};

export function EffectLog({ entries, onClear, hint }: Props) {
  return (
    <section className="effect-log" aria-label="Effect-Log">
      <header className="effect-log__head">
        <div>
          <h3>Live-Log</h3>
          <p>{hint ?? "Wann feuert Effect / Cleanup / Render?"}</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onClear}>
          Leeren
        </button>
      </header>
      <ol className="effect-log__list">
        {entries.length === 0 ? (
          <li className="effect-log__empty">Noch keine Events — interagiere mit dem Demo.</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className={`effect-log__item effect-log__item--${entry.kind}`}>
              <span className="effect-log__kind">{labels[entry.kind]}</span>
              <span className="effect-log__msg">{entry.message}</span>
              <time className="effect-log__time">{entry.time}</time>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
