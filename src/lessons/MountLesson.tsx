import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { EffectLog } from "../components/EffectLog";
import { LessonLayout } from "../components/LessonLayout";
import { useEffectLog } from "../hooks/useEffectLog";

const code = `useEffect(() => {
  console.log("Effect: nur nach Mount");
  // z.B. Analytics, einmaliger Setup
}, []); // ← leeres Array`;

export function MountLesson() {
  const { entries, log, clear } = useEffectLog();
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(true);

  return (
    <LessonLayout
      concept={
        <div className="concept">
          <h2>Leeres Array: einmal nach dem Mount</h2>
          <p>
            Mit <code>[]</code> läuft der Effect nur, wenn die Komponente zum ersten Mal
            erscheint. Re-Renders (z.B. durch State) ändern daran nichts — der Effect
            startet nicht neu.
          </p>
          <ul>
            <li>
              <strong>[]</strong> = „kein Wert, den ich beobachten will“
            </li>
            <li>
              <strong>Re-Render</strong> ≠ neuer Effect
            </li>
            <li>
              <strong>Unmount</strong> → Cleanup (falls vorhanden)
            </li>
          </ul>
          <div className="strict-note">
            <strong>Tipp:</strong> Komponente aus-/einblenden simuliert Unmount/Mount.
            Im Dev-Strict-Mode siehst du beim Mount oft Effect → Cleanup → Effect.
          </div>
        </div>
      }
      demo={
        <div>
          <h3>Interaktives Demo</h3>
          <p className="lede">
            Erhöhe den Counter — der Effect bleibt still. Unmounten startet neu.
          </p>
          <div className="demo-row">
            <div className="demo-stat">
              <span>Counter</span>
              <strong>{count}</strong>
            </div>
            <div className="demo-stat">
              <span>Status</span>
              <strong>{mounted ? "an" : "aus"}</strong>
            </div>
          </div>
          <div className="demo-row">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setCount((c) => c + 1)}
              disabled={!mounted}
            >
              Re-Render (+1)
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setMounted((m) => !m)}
            >
              {mounted ? "Unmounten" : "Wieder mounten"}
            </button>
          </div>
          {mounted ? (
            <MountChild log={log} count={count} />
          ) : (
            <p className="status-line">Komponente ist unmounted — kein Effect aktiv.</p>
          )}
        </div>
      }
      code={<CodeBlock caption="Beispielcode" code={code} />}
      log={
        <EffectLog
          entries={entries}
          onClear={clear}
          hint="Counter erhöhen → nur Render-Zähler. Mount → EFFECT."
        />
      }
    />
  );
}

function MountChild({
  log,
  count,
}: {
  log: (kind: "effect" | "cleanup" | "info", msg: string) => void;
  count: number;
}) {
  const renders = useRef(0);
  renders.current += 1;

  useEffect(() => {
    log("effect", "Effect mit [] gelaufen (Mount)");
    return () => {
      log("cleanup", "Cleanup von [] (Unmount / Strict Mode)");
    };
  }, [log]);

  return (
    <p className="status-line">
      Child gemountet · Renders: <em>{renders.current}</em> · Counter-Prop:{" "}
      <em>{count}</em> (Effect ignoriert Counter)
    </p>
  );
}
