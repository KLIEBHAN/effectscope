import { useEffect, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { EffectLog } from "../components/EffectLog";
import { LessonLayout } from "../components/LessonLayout";
import { useEffectLog } from "../hooks/useEffectLog";

const badCode = `// ❌ Endlosschleife
useEffect(() => {
  setCount(count + 1); // ändert count
}, [count]);           // → Effect läuft wieder`;

const goodCode = `// ✅ Ableitung ohne Effect
const doubled = count * 2;

// ✅ Oder funktionales Update, einmalig:
useEffect(() => {
  setCount((c) => c + 1);
}, []); // leeres Array — nur Mount`;

export function PitfallLesson() {
  const { entries, log, clear } = useEffectLog();
  const [armed, setArmed] = useState(false);
  const [count, setCount] = useState(0);
  const [safeCount, setSafeCount] = useState(0);

  useEffect(() => {
    if (!armed) return;
    if (count >= 12) {
      log("warn", "Schutzgrenze erreicht — Loop gestoppt");
      setArmed(false);
      return;
    }
    log("effect", `Bug-Effect setzt count → ${count + 1}`);
    setCount((c) => c + 1);
  }, [armed, count, log]);

  useEffect(() => {
    log("effect", "Guter Effect: +1 nur beim Mount");
    setSafeCount((c) => c + 1);
  }, [log]);

  return (
    <LessonLayout
      concept={
        <div className="concept">
          <h2>Fallstrick: setState im Effect mit derselben Dependency</h2>
          <p>
            Wenn der Effect einen Wert setzt, der in den Dependencies steht, entsteht
            eine Schleife: Effect → setState → Render → Effect → … Hier mit Soft-Limit,
            damit die App nicht stirbt.
          </p>
          <ul>
            <li>
              <strong>Symptom:</strong> flackerndes Log, hohe CPU
            </li>
            <li>
              <strong>Ursache:</strong> Dependency wird im Effect geschrieben
            </li>
            <li>
              <strong>Fix:</strong> ableiten, Event-Handler, oder [] / andere deps
            </li>
          </ul>
        </div>
      }
      demo={
        <div>
          <h3>Interaktives Demo</h3>
          <p className="lede">
            „Loop starten“ feuert den Bug (max. 12 Schritte). Daneben: korrekter Mount-Effect.
          </p>
          <div className="demo-row">
            <div className="demo-stat">
              <span>Bug-Count</span>
              <strong>{count}</strong>
            </div>
            <div className="demo-stat">
              <span>Safe (Mount)</span>
              <strong>{safeCount}</strong>
            </div>
          </div>
          <div className="demo-row">
            <button
              type="button"
              className="btn btn--danger"
              disabled={armed}
              onClick={() => {
                clear();
                setCount(0);
                setArmed(true);
                log("warn", "Loop aktiviert");
              }}
            >
              Loop starten
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setArmed(false);
                setCount(0);
                clear();
              }}
            >
              Reset
            </button>
          </div>
          <p className="status-line">
            {armed ? (
              <>
                Loop läuft… <em>Schutz bei 12</em>
              </>
            ) : (
              "Loop gestoppt / bereit"
            )}
          </p>
        </div>
      }
      code={
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <CodeBlock caption="Anti-Pattern" code={badCode} />
          <CodeBlock caption="Bessere Alternativen" code={goodCode} />
        </div>
      }
      log={<EffectLog entries={entries} onClear={clear} hint="Beobachte die Effect-Kaskade." />}
    />
  );
}
