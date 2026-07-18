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
  guardsCommittedGeneration: boolean;
  hasLoadingIndicator: boolean;
  source: string;
};

export const fetchRaceVariants: Record<FetchRaceVariantId, FetchRaceVariant> = {
  "fetch-race/bug-v1": {
    id: "fetch-race/bug-v1",
    label: "No request cleanup",
    abortOnCleanup: false,
    guardsCommittedGeneration: false,
    hasLoadingIndicator: false,
    source: `useEffect(() => {
  loadTodo(todoId).then(setTodo);
}, [todoId]);`,
  },
  "fetch-race/fix-abort-v1": {
    id: "fetch-race/fix-abort-v1",
    label: "Abort stale request in cleanup",
    abortOnCleanup: true,
    guardsCommittedGeneration: true,
    hasLoadingIndicator: false,
    source: `const generation = useRef(0);

useLayoutEffect(() => {
  generation.current += 1;
  return () => { generation.current += 1; };
}, [todoId]);

useEffect(() => {
  const controller = new AbortController();
  const current = generation.current;

  loadTodo(todoId, controller.signal)
    .then((todo) => {
      if (generation.current === current) setTodo(todo);
    })
    .catch((error) => {
      if (error.name !== "AbortError") throw error;
    });

  return () => controller.abort();
}, [todoId]);`,
  },
  "fetch-race/distractor-loading-v1": {
    id: "fetch-race/distractor-loading-v1",
    label: "Add a loading state",
    abortOnCleanup: false,
    guardsCommittedGeneration: false,
    hasLoadingIndicator: true,
    source: `useEffect(() => {
  setLoading(true);
  loadTodo(todoId).then((todo) => {
    setTodo(todo);
    setLoading(false);
  });
}, [todoId]);`,
  },
};
