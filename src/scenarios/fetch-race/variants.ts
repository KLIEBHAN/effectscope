export const fetchRaceVariantIds = [
  "fetch-race/bug-v1",
  "fetch-race/fix-abort-v1",
  "fetch-race/distractor-loading-v1",
] as const;

export type FetchRaceVariantId = (typeof fetchRaceVariantIds)[number];

export type FetchRaceVariant = {
  id: FetchRaceVariantId;
  label: string;
  abortOnCleanup: boolean;
  source: string;
};

export const fetchRaceVariants: Record<FetchRaceVariantId, FetchRaceVariant> = {
  "fetch-race/bug-v1": {
    id: "fetch-race/bug-v1",
    label: "No request cleanup",
    abortOnCleanup: false,
    source: `useEffect(() => {
  loadTodo(todoId).then(setTodo);
}, [todoId]);`,
  },
  "fetch-race/fix-abort-v1": {
    id: "fetch-race/fix-abort-v1",
    label: "Abort stale request in cleanup",
    abortOnCleanup: true,
    source: `useEffect(() => {
  const controller = new AbortController();

  loadTodo(todoId, controller.signal).then(setTodo);

  return () => controller.abort();
}, [todoId]);`,
  },
  "fetch-race/distractor-loading-v1": {
    id: "fetch-race/distractor-loading-v1",
    label: "Add a loading state",
    abortOnCleanup: false,
    source: `useEffect(() => {
  setLoading(true);
  loadTodo(todoId).then((todo) => {
    setTodo(todo);
    setLoading(false);
  });
}, [todoId]);`,
  },
};
