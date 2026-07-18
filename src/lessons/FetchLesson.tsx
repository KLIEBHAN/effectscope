import { useEffect, useState } from "react";
import { CodeBlock } from "../components/CodeBlock";
import { EffectLog } from "../components/EffectLog";
import { LessonLayout } from "../components/LessonLayout";
import { useEffectLog } from "../hooks/useEffectLog";

const code = `useEffect(() => {
  const ctrl = new AbortController();

  async function load() {
    const res = await fetch(url, { signal: ctrl.signal });
    const data = await res.json();
    setData(data);
  }

  load().catch((err) => {
    if (err.name !== "AbortError") throw err;
  });

  return () => ctrl.abort(); // Race vermeiden
}, [url]);`;

type Todo = { id: number; title: string };

const TODOS: Record<string, Todo> = {
  "1": { id: 1, title: "useEffect Dependencies verstehen" },
  "2": { id: 2, title: "Cleanup nicht vergessen" },
  "3": { id: 3, title: "Fetch mit AbortController" },
};

function fakeFetch(id: string, signal: AbortSignal): Promise<Todo> {
  return new Promise((resolve, reject) => {
    const delay = id === "2" ? 1800 : 600;
    const timer = window.setTimeout(() => {
      const todo = TODOS[id] ?? { id: Number(id), title: `Todo #${id}` };
      resolve(todo);
    }, delay);

    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export function FetchLesson() {
  const { entries, log, clear } = useEffectLog();
  const [todoId, setTodoId] = useState("1");
  const [data, setData] = useState<Todo | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "aborted">("idle");

  useEffect(() => {
    const ctrl = new AbortController();
    setStatus("loading");
    setData(null);
    log("effect", `Fetch start · todo ${todoId}`);

    fakeFetch(todoId, ctrl.signal)
      .then((todo) => {
        setData(todo);
        setStatus("done");
        log("info", `Fetch ok · „${todo.title}“`);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          setStatus("aborted");
          return;
        }
        log("warn", "Fetch fehlgeschlagen");
      });

    return () => {
      ctrl.abort();
      log("cleanup", `abort() · todo ${todoId}`);
    };
  }, [todoId, log]);

  return (
    <LessonLayout
      concept={
        <div className="concept">
          <h2>Fetch: Cleanup verhindert Race Conditions</h2>
          <p>
            Wechselt die Dependency (hier die Todo-ID) schneller als die Antwort kommt,
            würde ohne Abort die <em>alte</em> Antwort den State überschreiben. Cleanup
            mit <code>AbortController</code> bricht den veralteten Request ab.
          </p>
          <ul>
            <li>
              <strong>Todo 2</strong> ist absichtlich langsam (1.8s)
            </li>
            <li>
              <strong>Schnell wechseln</strong> → abort im Log
            </li>
            <li>
              <strong>Nur frische Daten</strong> landen im State
            </li>
          </ul>
        </div>
      }
      demo={
        <div>
          <h3>Interaktives Demo</h3>
          <p className="lede">
            Wähle Todo 2, wechsle sofort zu 1 oder 3 — die langsame Antwort darf nicht
            gewinnen.
          </p>
          <div className="field">
            <label htmlFor="todo">Todo-ID</label>
            <select
              id="todo"
              value={todoId}
              onChange={(e) => setTodoId(e.target.value)}
            >
              <option value="1">1 — schnell</option>
              <option value="2">2 — langsam (Race-Falle)</option>
              <option value="3">3 — schnell</option>
            </select>
          </div>
          <div className="demo-row">
            <div className="demo-stat">
              <span>Status</span>
              <strong style={{ fontSize: "1rem" }}>{status}</strong>
            </div>
          </div>
          <p className="status-line">
            {data ? (
              <>
                Geladen: <em>{data.title}</em>
              </>
            ) : status === "loading" ? (
              "Lädt…"
            ) : (
              "Keine Daten"
            )}
          </p>
        </div>
      }
      code={<CodeBlock caption="Beispielcode" code={code} />}
      log={<EffectLog entries={entries} onClear={clear} />}
    />
  );
}
