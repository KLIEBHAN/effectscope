import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { EffectLog } from "../components/EffectLog";
import { LessonLayout } from "../components/LessonLayout";
import { useEffectLog } from "../hooks/useEffectLog";

const code = `useEffect(() => {
  document.title = \`Suchbegriff: \${query}\`;
}, [query]); // nur wenn query sich ändert`;

export function DepsLesson() {
  const { entries, log, clear } = useEffectLog();
  const [query, setQuery] = useState("react");
  const [unrelated, setUnrelated] = useState(0);
  const renders = useRef(0);
  renders.current += 1;

  useEffect(() => {
    log("effect", `Title-Sync Effect · query="${query}"`);
    const previous = document.title;
    document.title = `Lab · ${query}`;
    return () => {
      log("cleanup", `Title zurücksetzen von "${query}"`);
      document.title = previous;
    };
  }, [query, log]);

  return (
    <LessonLayout
      concept={
        <div className="concept">
          <h2>Dependencies: Effect nur bei Änderung</h2>
          <p>
            Werte im Array sind die „Abhängigkeiten“. Ändert sich einer davon (per
            Object.is), läuft Cleanup + Effect erneut. Andere State-Updates lassen den
            Effect in Ruhe.
          </p>
          <ul>
            <li>
              <strong>[query]</strong> beobachtet nur query
            </li>
            <li>
              <strong>unrelated++</strong> = Render, kein Effect
            </li>
            <li>
              <strong>Exhaustive deps</strong> im Linter helfen
            </li>
          </ul>
        </div>
      }
      demo={
        <div>
          <h3>Interaktives Demo</h3>
          <p className="lede">
            Ändere die Query → Effect. Erhöhe „unrelated“ → nur Render.
          </p>
          <div className="field">
            <label htmlFor="query">Suchbegriff (Dependency)</label>
            <input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="demo-row">
            <div className="demo-stat">
              <span>document.title</span>
              <strong style={{ fontSize: "1rem" }}>Lab · {query}</strong>
            </div>
            <div className="demo-stat">
              <span>unrelated</span>
              <strong>{unrelated}</strong>
            </div>
            <div className="demo-stat">
              <span>Renders</span>
              <strong>{renders.current}</strong>
            </div>
          </div>
          <div className="demo-row">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setUnrelated((n) => n + 1)}
            >
              Unrelated +1
            </button>
          </div>
        </div>
      }
      code={<CodeBlock caption="Beispielcode" code={code} />}
      log={
        <EffectLog
          entries={entries}
          onClear={clear}
          hint="Tippe in Query vs. Unrelated-Button vergleichen."
        />
      }
    />
  );
}
