import { useCallback, useRef, useState } from "react";
import type { LogEntry, LogKind } from "../types";

let nextId = 1;

function stamp() {
  const d = new Date();
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

export function useEffectLog(limit = 40) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const limitRef = useRef(limit);
  limitRef.current = limit;

  const log = useCallback((kind: LogKind, message: string) => {
    setEntries((prev) => {
      const entry: LogEntry = {
        id: nextId++,
        kind,
        message,
        time: stamp(),
      };
      return [entry, ...prev].slice(0, limitRef.current);
    });
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return { entries, log, clear };
}
