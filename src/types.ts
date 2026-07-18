export type LogKind = "effect" | "cleanup" | "render" | "info" | "warn";

export type LogEntry = {
  id: number;
  kind: LogKind;
  message: string;
  time: string;
};

export type LessonId =
  | "intro"
  | "mount"
  | "every-render"
  | "deps"
  | "cleanup"
  | "fetch"
  | "pitfall";

export type Lesson = {
  id: LessonId;
  number: string;
  title: string;
  subtitle: string;
};
