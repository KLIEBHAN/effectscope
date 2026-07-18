import type { Lesson } from "./types";

export const lessons: Lesson[] = [
  {
    id: "intro",
    number: "00",
    title: "Was ist useEffect?",
    subtitle: "Side Effects nach dem Render",
  },
  {
    id: "mount",
    number: "01",
    title: "Nur beim Mount",
    subtitle: "Leeres Dependency-Array []",
  },
  {
    id: "every-render",
    number: "02",
    title: "Bei jedem Render",
    subtitle: "Ohne Dependency-Array",
  },
  {
    id: "deps",
    number: "03",
    title: "Abhängigkeiten",
    subtitle: "Effect wenn sich Werte ändern",
  },
  {
    id: "cleanup",
    number: "04",
    title: "Cleanup",
    subtitle: "Aufräumen bevor es neu läuft",
  },
  {
    id: "fetch",
    number: "05",
    title: "Fetch & Race",
    subtitle: "AbortController in der Praxis",
  },
  {
    id: "pitfall",
    number: "06",
    title: "Endlosschleife",
    subtitle: "Der klassische Fehler",
  },
];
