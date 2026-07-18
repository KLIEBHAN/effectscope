import type { ReactNode } from "react";
import "./LessonLayout.css";

type Props = {
  concept: ReactNode;
  demo: ReactNode;
  code: ReactNode;
  log: ReactNode;
};

export function LessonLayout({ concept, demo, code, log }: Props) {
  return (
    <div className="lesson-layout">
      <div className="lesson-layout__concept">{concept}</div>
      <div className="lesson-layout__demo panel">{demo}</div>
      <div className="lesson-layout__code">{code}</div>
      <div className="lesson-layout__log">{log}</div>
    </div>
  );
}
