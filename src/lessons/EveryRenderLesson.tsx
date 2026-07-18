import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { EffectLog } from "../components/EffectLog";
import { LessonLayout } from "../components/LessonLayout";
import { useEffectLog } from "../hooks/useEffectLog";

const code = `useEffect(() => {
  console.log("läuft nach JEDEM Render");
}); // ← kein zweites Argument!`;

export function EveryRenderLesson() {
  const { entries, log, clear } = useEffectLog();
  const [count, setCount] = useState(0);
  const renders = useRef(0);
  renders.current += 1;

  useEffect(() => {
    log("effect", `Effect ohne deps · count ist jetzt ${count}`);
    return () => {
      log("cleanup", `Cleanup vor nächstem Lauf · alter count=${count}`);
    };
  }); // absichtlich ohne Dependency-Array

  return (
    <LessonLayout
      concept={
        <div className="concept">
          <h2>Kein Array: Effect nach jedem Render</h2>
          <p>
            Lässt du das Dependency-Array weg, läuft der Effect nach <em>jedem</em>{" "}
            Render. Vor dem nächsten Lauf führt React zuerst den Cleanup aus. Das ist
            selten gewollt — und teuer.
          </p>
          <ul>
            <li>
              <strong>Render</strong> → Cleanup → Effect
            </li>
            <li>
              <strong>Nutzen</strong> eher selten (Debug, Messung)
            </li>
            <li>
              <strong>Besser:</strong> gezielt Dependencies setzen
            </li>
          </ul>
        </div>
      }
      demo={
        <div>
          <h3>Interaktives Demo</h3>
          <p className="lede">Jeder Klick = neuer Render = Cleanup + Effect.</p>
          <div className="demo-row">
            <div className="demo-stat">
              <span>Count</span>
              <strong>{count}</strong>
            </div>
            <div className="demo-stat">
              <span>Renders</span>
              <strong>{renders.current}</strong>
            </div>
          </div>
          <div className="demo-row">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setCount((c) => c + 1)}
            >
              Erneut rendern
            </button>
          </div>
          <p className="status-line">
            Schau ins Log: nach jedem Klick <em>CLEANUP</em> dann <em>EFFECT</em>.
          </p>
        </div>
      }
      code={<CodeBlock caption="Beispielcode" code={code} />}
      log={<EffectLog entries={entries} onClear={clear} />}
    />
  );
}
