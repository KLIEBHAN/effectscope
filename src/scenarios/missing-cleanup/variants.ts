export const missingCleanupVariantIds = [
  "missing-cleanup/bug-v1",
  "missing-cleanup/fix-clear-v1",
  "missing-cleanup/distractor-restart-v1",
] as const;

export type MissingCleanupVariantId = (typeof missingCleanupVariantIds)[number];

export type MissingCleanupVariant = {
  id: MissingCleanupVariantId;
  label: string;
  cleansUp: boolean;
  startsExtraTimer: boolean;
  source: string;
};

export const missingCleanupVariants: Record<
  MissingCleanupVariantId,
  MissingCleanupVariant
> = {
  "missing-cleanup/bug-v1": {
    id: "missing-cleanup/bug-v1",
    label: "No timer cleanup",
    cleansUp: false,
    startsExtraTimer: false,
    source: `useEffect(() => {
  setInterval(tick, 500);
}, []);`,
  },
  "missing-cleanup/fix-clear-v1": {
    id: "missing-cleanup/fix-clear-v1",
    label: "Clear the interval in cleanup",
    cleansUp: true,
    startsExtraTimer: false,
    source: `useEffect(() => {
  const timer = setInterval(tick, 500);

  return () => clearInterval(timer);
}, []);`,
  },
  "missing-cleanup/distractor-restart-v1": {
    id: "missing-cleanup/distractor-restart-v1",
    label: "Start another timer on mount",
    cleansUp: false,
    startsExtraTimer: true,
    source: `useEffect(() => {
  setInterval(tick, 500);
  setInterval(tick, 500);
}, []);`,
  },
};
