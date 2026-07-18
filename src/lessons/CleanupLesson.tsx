import { useEffect, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { EffectLog } from "../components/EffectLog";
import { LessonLayout } from "../components/LessonLayout";
import { useEffectLog } from "../hooks/useEffectLog";

const code = `useEffect(() => {
  const id = setInterval(() => {
    setSeconds((s) => s + 1);
  }, 1000);

  return () => clearInterval(id); // Cleanup!
}, []);`;

export function CleanupLesson() {
  const { entries, log, clear } = useEffectLog();
  const [running, setRunning] = useState(true);
  const [intervalMs, setIntervalMs] = useState(1000);

  return (
    <LessonLayout
      concept={
        <div className="concept">
          <h2>Cleanup: Ressourcen wieder freigeben</h2>
          <p>
            Der Return-Wert eines Effects ist eine Cleanup-Funktion. React ruft sie auf,
            bevor der Effect erneut läuft oder die Komponente unmountet — damit Timer,
            Listener und Subscriptions nicht „leaken“.
          </p>
          <ul>
            <li>
              <strong>setInterval</strong> braucht clearInterval
            </li>
            <li>
              <strong>addEventListener</strong> → remove
            </li>
            <li>
              <strong>Deps ändern</strong> → erst Cleanup, dann neu
            </li>
          </ul>
        </div>
      }
      demo={
        <div>
          <h3>Interaktives Demo</h3>
          <p className="lede">
            Intervall starten/stoppen oder Tempo ändern — Cleanup räumt den alten Timer
            weg.
          </p>
          <div className="field">
            <label htmlFor="ms">Intervall (ms) — Dependency</label>
            <select
              id="ms"
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              disabled={!running}
            >
              <option value={1000}>1000 ms</option>
              <option value={500}>500 ms</option>
              <option value={200}>200 ms</option>
            </select>
          </div>
          <div className="demo-row">
            <button
              type="button"
              className={running ? "btn btn--danger" : "btn btn--primary"}
              onClick={() => setRunning((r) => !r)}
            >
              {running ? "Timer stoppen (Unmount)" : "Timer starten (Mount)"}
            </button>
          </div>
          {running ? (
            <TimerDisplay intervalMs={intervalMs} log={log} />
          ) : (
            <p className="status-line">Kein Timer gemountet.</p>
          )}
        </div>
      }
      code={<CodeBlock caption="Beispielcode" code={code} />}
      log={
        <EffectLog
          entries={entries}
          onClear={clear}
          hint="Tempo wechseln → CLEANUP alter Timer, dann neuer EFFECT."
        />
      }
    />
  );
}

function TimerDisplay({
  intervalMs,
  log,
}: {
  intervalMs: number;
  log: (kind: "effect" | "cleanup" | "info", msg: string) => void;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    log("effect", `setInterval gestartet · ${intervalMs}ms`);
    const id = window.setInterval(() => {
      setSeconds((s) => s + 1);
      log("info", `Tick · ${intervalMs}ms`);
    }, intervalMs);

    return () => {
      window.clearInterval(id);
      log("cleanup", `clearInterval · ${intervalMs}ms`);
    };
  }, [intervalMs, log]);

  return (
    <div className="demo-row">
      <div className="demo-stat">
        <span>Ticks</span>
        <strong>{seconds}</strong>
      </div>
      <div className="demo-stat">
        <span>Intervall</span>
        <strong style={{ fontSize: "1.1rem" }}>{intervalMs}ms</strong>
      </div>
    </div>
  );
}
