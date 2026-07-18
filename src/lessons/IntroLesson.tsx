import { CodeBlock } from "../components/CodeBlock";
import { LessonLayout } from "../components/LessonLayout";
import "./IntroLesson.css";

const code = `// useEffect läuft NACH dem Paint — nicht während des Renders.
useEffect(() => {
  // Side Effect: DOM, Netzwerk, Timer, Subscriptions …
  return () => {
    // optional: Cleanup
  };
}, [/* dependencies */]);`;

export function IntroLesson() {
  return (
    <LessonLayout
      concept={
        <div className="concept">
          <h2>Effects sind Synchronisation mit der Außenwelt</h2>
          <p>
            <code>useEffect</code> sagt React: „Nachdem du die UI gezeichnet hast, führe
            diesen Code aus.“ Ideal für Dinge, die nicht zum reinen Berechnen von JSX
            gehören — Fetch, Timer, Event-Listener, localStorage.
          </p>
          <ul>
            <li>
              <strong>Render</strong> = UI berechnen
            </li>
            <li>
              <strong>Effect</strong> = danach Side Effects
            </li>
            <li>
              <strong>Cleanup</strong> = aufräumen / abbrechen
            </li>
          </ul>
          <div className="strict-note">
            <strong>Strict Mode (Dev):</strong> React mountet Effects absichtlich
            doppelt (mount → cleanup → mount), damit fehlende Cleanups auffallen. Im
            Log siehst du das — in Production passiert es nicht.
          </div>
        </div>
      }
      demo={
        <div className="intro-flow">
          <h3>Reihenfolge in einem Update</h3>
          <p className="lede">So denkt React über Effects — Schritt für Schritt.</p>
          <ol className="flow-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Render</strong>
                <p>Komponente läuft, JSX entsteht. Keine Side Effects hier.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Commit / Paint</strong>
                <p>React schreibt Änderungen in den DOM. Du siehst die UI.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>useEffect</strong>
                <p>Jetzt laufen Effects. Dependencies entscheiden, welche.</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>Cleanup (später)</strong>
                <p>Vor dem nächsten Effect-Lauf oder beim Unmount.</p>
              </div>
            </li>
          </ol>
        </div>
      }
      code={<CodeBlock caption="Signatur" code={code} />}
      log={
        <div className="intro-tips panel">
          <h3>Merksätze</h3>
          <ul>
            <li>
              Effects ersetzen nicht Event-Handler. Klick → Handler. Sync mit System →
              Effect.
            </li>
            <li>
              Das Dependency-Array steuert <em>wann</em> der Effect erneut läuft — nicht
              „ob er existiert“.
            </li>
            <li>
              Wenn du etwas aufräumst (Timer, Listener, Abort), gehört das in den
              Cleanup-Return.
            </li>
          </ul>
          <p className="intro-cta">Wähle links Lektion 01 — und beobachte das Live-Log.</p>
        </div>
      }
    />
  );
}
