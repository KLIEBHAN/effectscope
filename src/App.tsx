import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { lessons } from "./lessons";
import { CleanupLesson } from "./lessons/CleanupLesson";
import { DepsLesson } from "./lessons/DepsLesson";
import { EveryRenderLesson } from "./lessons/EveryRenderLesson";
import { FetchLesson } from "./lessons/FetchLesson";
import { IntroLesson } from "./lessons/IntroLesson";
import { MountLesson } from "./lessons/MountLesson";
import { PitfallLesson } from "./lessons/PitfallLesson";
import type { LessonId } from "./types";
import "./App.css";

function LessonView({ id }: { id: LessonId }) {
  switch (id) {
    case "intro":
      return <IntroLesson />;
    case "mount":
      return <MountLesson />;
    case "every-render":
      return <EveryRenderLesson />;
    case "deps":
      return <DepsLesson />;
    case "cleanup":
      return <CleanupLesson />;
    case "fetch":
      return <FetchLesson />;
    case "pitfall":
      return <PitfallLesson />;
  }
}

export default function App() {
  const [active, setActive] = useState<LessonId>("intro");
  const current = lessons.find((l) => l.id === active)!;
  const index = lessons.findIndex((l) => l.id === active);

  return (
    <div className="app">
      <div className="app__glow" aria-hidden />
      <header className="hero">
        <p className="hero__brand">EffectScope</p>
        <h1>See what React actually did.</h1>
        <p className="hero__lead">
          Predict an effect, run the component, then inspect every render, cleanup,
          and async write. The diagnosis workspace is now being instrumented.
        </p>
      </header>

      <div className="shell">
        <nav className="nav" aria-label="Concept lessons">
          <p className="nav__label">Baseline concepts</p>
          <ol>
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <button
                  type="button"
                  className={lesson.id === active ? "nav__item is-active" : "nav__item"}
                  onClick={() => setActive(lesson.id)}
                >
                  <span className="nav__num">{lesson.number}</span>
                  <span className="nav__text">
                    <strong>{lesson.title}</strong>
                    <small>{lesson.subtitle}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="main">
          <div className="main__meta">
            <span className="main__eyebrow">
              Lesson {current.number} / {lessons.length.toString().padStart(2, "0")}
            </span>
            <div className="main__nav-btns">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={index <= 0}
                onClick={() => setActive(lessons[index - 1].id)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={index >= lessons.length - 1}
                onClick={() => setActive(lessons[index + 1].id)}
              >
                Next
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <LessonView id={active} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <footer className="footer">
        <p>
          Instrumented React learning · deterministic evidence before explanation
        </p>
      </footer>
    </div>
  );
}
