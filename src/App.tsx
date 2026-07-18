import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { scenarioContent, type RepairChoice } from "./app/scenarioContent";
import { evaluateFetchRace, evaluateMissingCleanup } from "./domain/invariant";
import { createScenarioRunner, type ScenarioRunner } from "./domain/scenarioRunner";
import type { ScenarioId, TraceEvent } from "./domain/trace";
import { CoachPanel } from "./features/diagnose/CoachPanel";
import { EventTimeline } from "./features/diagnose/EventTimeline";
import { PredictionPanel } from "./features/diagnose/PredictionPanel";
import { RepairPanel } from "./features/diagnose/RepairPanel";
import { SourcePanel } from "./features/diagnose/SourcePanel";
import { createBrowserScheduler } from "./infrastructure/browserScheduler";
import { FetchRaceHarness, type TodoSelection } from "./scenarios/fetch-race/FetchRaceHarness";
import { fetchRaceVariants } from "./scenarios/fetch-race/variants";
import { MissingCleanupHarness } from "./scenarios/missing-cleanup/MissingCleanupHarness";
import { missingCleanupVariants } from "./scenarios/missing-cleanup/variants";
import { isScenarioVariantIdFor, type ScenarioVariantId } from "./scenarios/registry";
import "./App.css";

type ExperienceStage = "predict" | "ready" | "running" | "repair" | "proved";

type FetchRun = {
  scenarioId: "fetch-race";
  runner: ScenarioRunner<"fetch-race">;
  selected: TodoSelection;
};

type CleanupRun = {
  scenarioId: "missing-cleanup";
  runner: ScenarioRunner<"missing-cleanup">;
  mounted: boolean;
  instanceId: string;
  cycle: 0 | 1;
};

type ActiveRun = FetchRun | CleanupRun;

const scenarioOrder: readonly ScenarioId[] = ["fetch-race", "missing-cleanup"];

function sourceForVariant(variantId: ScenarioVariantId) {
  if (isScenarioVariantIdFor("fetch-race", variantId)) {
    return fetchRaceVariants[variantId];
  }
  return missingCleanupVariants[variantId];
}

function HarnessViewport({ run }: { run: ActiveRun | null }) {
  if (!run) {
    return (
      <div className="runtime-screen is-idle">
        <span aria-hidden>∿</span>
        <p>Component output appears here during a run.</p>
      </div>
    );
  }

  if (run.scenarioId === "fetch-race") {
    return (
      <div className="runtime-screen">
        <p className="runtime-screen__label">Rendered output</p>
        <FetchRaceHarness runner={run.runner} selected={run.selected} />
      </div>
    );
  }

  return (
    <div className="runtime-screen">
      <p className="runtime-screen__label">Rendered output</p>
      <MissingCleanupHarness
        runner={run.runner}
        mounted={run.mounted}
        instanceId={run.instanceId}
        cycle={run.cycle}
      />
      {!run.mounted ? <span className="runtime-screen__unmounted">Component unmounted</span> : null}
    </div>
  );
}

export default function App() {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>("fetch-race");
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [repairId, setRepairId] = useState<string | null>(null);
  const [stage, setStage] = useState<ExperienceStage>("predict");
  const [events, setEvents] = useState<readonly TraceEvent[]>([]);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [executedVariantId, setExecutedVariantId] = useState<ScenarioVariantId>(
    scenarioContent["fetch-race"].bugVariantId,
  );
  const [completedScenarios, setCompletedScenarios] = useState<ReadonlySet<ScenarioId>>(
    new Set(),
  );
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const runnerRef = useRef<ScenarioRunner | null>(null);
  const controlTimers = useRef(new Map<string, number>());
  const eventBuffer = useRef<TraceEvent[]>([]);
  const runSequence = useRef(0);
  const repairHeadingRef = useRef<HTMLHeadingElement>(null);
  const verdictRef = useRef<HTMLDivElement>(null);

  const clearControlTimers = useCallback(() => {
    for (const timer of controlTimers.current.values()) {
      window.clearTimeout(timer);
    }
    controlTimers.current.clear();
  }, []);

  const disposeCurrentRun = useCallback(() => {
    clearControlTimers();
    runnerRef.current?.dispose();
    runnerRef.current = null;
  }, [clearControlTimers]);

  useEffect(() => disposeCurrentRun, [disposeCurrentRun]);

  useEffect(() => {
    if (stage === "repair") {
      repairHeadingRef.current?.focus();
    } else if (stage === "proved") {
      verdictRef.current?.focus();
    }
  }, [stage]);

  const scheduleControl = (key: string, delayMs: number, task: () => void) => {
    if (controlTimers.current.has(key)) {
      return;
    }
    const timer = window.setTimeout(() => {
      controlTimers.current.delete(key);
      task();
    }, delayMs);
    controlTimers.current.set(key, timer);
  };

  const recordEvent = (scenarioId: ScenarioId, event: TraceEvent) => {
    eventBuffer.current.push(event);
    setEvents((current) => [...current, event]);
    if (event.kind === "invariant_pass") {
      setCompletedScenarios((current) => new Set(current).add(scenarioId));
      setStage("proved");
    } else if (event.kind === "invariant_fail") {
      setStage("repair");
    }
  };

  const finishRunner = (runner: ScenarioRunner) => {
    if (runnerRef.current !== runner) {
      return;
    }
    try {
      runner.finish();
      runnerRef.current = null;
      clearControlTimers();
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : "Run failed unexpectedly.");
      setStage("repair");
    }
  };

  const startVariant = (variantId: ScenarioVariantId) => {
    disposeCurrentRun();
    setRuntimeError(null);
    setEvents([]);
    eventBuffer.current = [];
    setExecutedVariantId(variantId);
    setStage("running");
    const runId = `${activeScenario}-${String(++runSequence.current)}`;

    if (activeScenario === "fetch-race") {
      if (!isScenarioVariantIdFor("fetch-race", variantId)) {
        throw new Error("Fetch Race received a variant from another scenario.");
      }
      let runner: ScenarioRunner<"fetch-race">;
      runner = createScenarioRunner({
        runId,
        scenarioId: "fetch-race",
        variantId,
        scheduler: createBrowserScheduler(),
        onEvent: (event) => {
          recordEvent("fetch-race", event);
          if (
            event.kind === "async_start" &&
            event.data?.selection === "B"
          ) {
            scheduleControl(`${runId}:select-c`, 60, () => {
              if (runnerRef.current !== runner) return;
              flushSync(() => {
                setActiveRun((current) =>
                  current?.runner === runner
                    ? { ...current, selected: "C" }
                    : current,
                );
              });
            });
          }

          if (event.kind === "invariant_pass" || event.kind === "invariant_fail") {
            return;
          }
          const result = evaluateFetchRace(eventBuffer.current);
          if (result.status !== "pending") {
            scheduleControl(`${runId}:finish`, 0, () => finishRunner(runner));
          }
        },
        onObserverError: () => setRuntimeError("Trace display could not process an event."),
      });
      runnerRef.current = runner;
      setActiveRun({ scenarioId: "fetch-race", runner, selected: "B" });
      return;
    }

    if (!isScenarioVariantIdFor("missing-cleanup", variantId)) {
      throw new Error("Missing Cleanup received a variant from another scenario.");
    }
    let runner: ScenarioRunner<"missing-cleanup">;
    runner = createScenarioRunner({
      runId,
      scenarioId: "missing-cleanup",
      variantId,
      scheduler: createBrowserScheduler(),
      onEvent: (event) => {
        recordEvent("missing-cleanup", event);
        if (event.kind === "invariant_pass" || event.kind === "invariant_fail") {
          return;
        }

        if (event.kind === "timer_tick" && event.data?.cycle === 0) {
          scheduleControl(`${runId}:unmount`, 40, () => {
            if (runnerRef.current !== runner) return;
            flushSync(() => {
              setActiveRun((current) =>
                current?.runner === runner ? { ...current, mounted: false } : current,
              );
            });
          });
        }

        if (
          event.kind === "render" &&
          event.data?.cycle === 0 &&
          event.data.mounted === false
        ) {
          scheduleControl(`${runId}:remount`, 60, () => {
            if (runnerRef.current !== runner) return;
            flushSync(() => {
              setActiveRun((current) =>
                current?.runner === runner
                  ? {
                      ...current,
                      mounted: true,
                      instanceId: "instance-2",
                      cycle: 1,
                    }
                  : current,
              );
            });
          });
        }

        if (event.kind === "timer_tick" && event.data?.cycle === 1) {
          const result = evaluateMissingCleanup(eventBuffer.current);
          if (result.status !== "pending") {
            scheduleControl(`${runId}:finish`, 0, () => finishRunner(runner));
          }
        }
      },
      onObserverError: () => setRuntimeError("Trace display could not process an event."),
    });
    runnerRef.current = runner;
    setActiveRun({
      scenarioId: "missing-cleanup",
      runner,
      mounted: true,
      instanceId: "instance-1",
      cycle: 0,
    });
  };

  const selectScenario = (scenarioId: ScenarioId) => {
    disposeCurrentRun();
    setActiveScenario(scenarioId);
    setPredictionId(null);
    setRepairId(null);
    setStage("predict");
    setEvents([]);
    setActiveRun(null);
    setRuntimeError(null);
    eventBuffer.current = [];
    setExecutedVariantId(scenarioContent[scenarioId].bugVariantId);
  };

  const resetAttempt = () => {
    disposeCurrentRun();
    setEvents([]);
    setActiveRun(null);
    setRepairId(null);
    setRuntimeError(null);
    eventBuffer.current = [];
    setExecutedVariantId(scenarioContent[activeScenario].bugVariantId);
    setStage(predictionId ? "ready" : "predict");
  };

  const content = scenarioContent[activeScenario];
  const sourceVariant = sourceForVariant(executedVariantId);
  const selectedRepair = content.repairs.find((choice) => choice.id === repairId) ?? null;
  const running = stage === "running";
  const terminalEvent = events.findLast(
    (event) => event.kind === "invariant_pass" || event.kind === "invariant_fail",
  );
  const selectedPrediction = content.predictions.find(
    (choice) => choice.id === predictionId,
  );
  const testedRepairFailed =
    stage === "repair" && selectedRepair?.variantId === executedVariantId;
  const predictionCorrect = predictionId === content.correctPredictionId;
  const runStatus = running
    ? "Running"
    : stage === "predict"
      ? "Needs prediction"
      : stage === "ready"
        ? "Ready"
        : stage === "repair"
          ? "Failed"
          : "Proved";
  const loopSteps = [
    { label: "Predict", done: predictionId !== null },
    { label: "Run", done: events.length > 0 },
    { label: "Observe", done: terminalEvent !== undefined },
    {
      label: "Repair",
      done:
        repairId !== null &&
        !testedRepairFailed,
    },
    { label: "Prove", done: stage === "proved" },
  ];
  const currentLoopStep = loopSteps.findIndex((step) => !step.done);
  const announcement = runtimeError
    ? runtimeError
    : terminalEvent
      ? `${terminalEvent.kind === "invariant_pass" ? "Invariant proved" : "Invariant violated"}. ${terminalEvent.message}`
      : running
        ? `${content.shortTitle} run in progress.`
        : `${content.shortTitle}: ${runStatus}.`;

  const chooseRepair = (choice: RepairChoice) => {
    setRepairId(choice.id);
  };

  return (
    <div className="app-shell">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <header className="topbar">
        <a className="brand" href="#workspace" aria-label="Jump to EffectScope workspace">
          <span className="brand__mark" aria-hidden>ES</span>
          <span>
            <strong>EffectScope</strong>
            <small>React effect diagnostics</small>
          </span>
        </a>
        <div className="topbar__meta">
          <span><i className="status-dot" aria-hidden /> Runtime connected</span>
          <span className="build-tag">BUILD WEEK · 2026</span>
        </div>
      </header>

      <div className="app-frame" id="workspace">
        <aside className="scenario-rail">
          <div className="rail-intro">
            <p className="kicker">Diagnostic queue</p>
            <strong>{completedScenarios.size} / 2 proved once</strong>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Scenario progress"
              aria-valuemin={0}
              aria-valuemax={2}
              aria-valuenow={completedScenarios.size}
            >
              <span style={{ width: `${completedScenarios.size * 50}%` }} />
            </div>
          </div>

          <nav aria-label="Effect scenarios">
            <ol className="scenario-list">
              {scenarioOrder.map((scenarioId) => {
                const scenario = scenarioContent[scenarioId];
                const complete = completedScenarios.has(scenarioId);
                return (
                  <li key={scenarioId}>
                    <button
                      type="button"
                      className={scenarioId === activeScenario ? "scenario-link is-active" : "scenario-link"}
                      aria-label={`${scenario.shortTitle}${complete ? " — proved" : ""}`}
                      aria-current={scenarioId === activeScenario ? "page" : undefined}
                      onClick={() => selectScenario(scenarioId)}
                    >
                      <span className="scenario-link__number">{scenario.number}</span>
                      <span>
                        <strong>{scenario.shortTitle}</strong>
                        <small>{scenario.eyebrow}</small>
                      </span>
                      <span
                        aria-hidden
                        className={complete ? "scenario-link__state is-complete" : "scenario-link__state"}
                      >
                        {complete ? "✓" : "○"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="rail-note">
            <span aria-hidden>Truth source</span>
            <p>Checked-in React variants + deterministic invariant evaluator.</p>
          </div>
        </aside>

        <main className="workspace">
          <section className="scenario-hero">
            <div>
              <p className="kicker">Scenario {content.number} · {content.eyebrow}</p>
              <h1>{content.title}</h1>
              <p>{content.problem}</p>
            </div>
            <div className="invariant-card">
              <span>Invariant under test</span>
              <strong>{content.invariant}</strong>
              <small>{content.interaction}</small>
            </div>
          </section>

          <div className="loop-strip" role="list" aria-label="Learning loop progress">
            {loopSteps.map(({ label, done }, index) => (
              <span
                className={`${done ? "is-done" : ""}${index === currentLoopStep ? " is-current" : ""}`}
                key={label}
                role="listitem"
                aria-current={index === currentLoopStep ? "step" : undefined}
              >
                <b>{String(index + 1).padStart(2, "0")}</b>{label}
                <span className="sr-only">
                  {done ? " complete" : index === currentLoopStep ? " current" : " pending"}
                </span>
              </span>
            ))}
          </div>

          <div className="workbench">
            <div className="workbench__left">
              <section className="instrument prediction-instrument" aria-labelledby="prediction-title">
                <div className="instrument__head">
                  <div>
                    <p className="kicker">Step 01</p>
                    <h2 id="prediction-title">Commit your prediction</h2>
                  </div>
                  <span className="instrument__status">
                    {predictionId ? "Committed" : "Required"}
                  </span>
                </div>
                <PredictionPanel
                  choices={content.predictions}
                  disabled={running || events.length > 0}
                  selectedId={predictionId}
                  onSelect={(id) => {
                    setPredictionId(id);
                    setStage("ready");
                  }}
                />
              </section>

              <section className="instrument run-panel" aria-labelledby="run-title">
                <div className="instrument__head">
                  <div>
                    <p className="kicker">Step 02</p>
                    <h2 id="run-title">Execute the sequence</h2>
                  </div>
                  <span className={running ? "instrument__status is-running" : "instrument__status"}>
                    {runStatus}
                  </span>
                </div>
                <HarnessViewport run={activeRun} />
                <div className="run-actions">
                  <button
                    className="button button--primary"
                    type="button"
                    disabled={!predictionId || running || events.length > 0}
                    onClick={() => startVariant(content.bugVariantId)}
                  >
                    Run bug sequence
                  </button>
                  <button className="button button--quiet" type="button" onClick={resetAttempt}>
                    Reset
                  </button>
                </div>
                {!predictionId ? <p className="run-hint">Select one prediction to arm runtime controls.</p> : null}
                {runtimeError ? <p className="runtime-error" role="alert">{runtimeError}</p> : null}
              </section>

              <SourcePanel label={sourceVariant.label} source={sourceVariant.source} />

              {stage === "repair" || repairId || stage === "proved" ? (
                <RepairPanel
                  choices={content.repairs}
                  disabled={running}
                  headingRef={repairHeadingRef}
                  rejected={testedRepairFailed}
                  selectedId={repairId}
                  verified={stage === "proved"}
                  onSelect={chooseRepair}
                  onRun={() => {
                    if (selectedRepair) startVariant(selectedRepair.variantId);
                  }}
                />
              ) : null}
            </div>

            <div className="workbench__right">
              <EventTimeline events={events} running={running} />
              <CoachPanel
                actualBugOutcome={content.actualBugOutcome}
                events={events}
                executedVariantLabel={sourceVariant.label}
                predictionCorrect={predictionCorrect}
                predictionLabel={selectedPrediction?.label ?? null}
                verdictRef={verdictRef}
              />
            </div>
          </div>
        </main>
      </div>

      <footer className="site-footer">
        <span>EffectScope / Education</span>
        <span>Runtime evidence before model explanation</span>
      </footer>
    </div>
  );
}
