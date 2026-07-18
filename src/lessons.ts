import type { Lesson } from "./types";

export const lessons: Lesson[] = [
  {
    id: "intro",
    number: "00",
    title: "What is useEffect?",
    subtitle: "Side effects after render",
  },
  {
    id: "mount",
    number: "01",
    title: "Mount only",
    subtitle: "Empty dependency array []",
  },
  {
    id: "every-render",
    number: "02",
    title: "Every render",
    subtitle: "No dependency array",
  },
  {
    id: "deps",
    number: "03",
    title: "Dependencies",
    subtitle: "Run when values change",
  },
  {
    id: "cleanup",
    number: "04",
    title: "Cleanup",
    subtitle: "Clean up before rerunning",
  },
  {
    id: "fetch",
    number: "05",
    title: "Fetch & Race",
    subtitle: "AbortController in practice",
  },
  {
    id: "pitfall",
    number: "06",
    title: "Infinite loop",
    subtitle: "The classic effect trap",
  },
];
