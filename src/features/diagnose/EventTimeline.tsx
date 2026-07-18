import { useEffect, useRef } from "react";
import type { TraceEvent, TraceEventKind } from "../../domain/trace";

type EventTimelineProps = {
  events: readonly TraceEvent[];
  highlightedEventId: string | null;
  running: boolean;
};

const eventGroup: Partial<Record<TraceEventKind, string>> = {
  cleanup: "cleanup",
  abort: "cleanup",
  timer_stop: "cleanup",
  stale_write: "danger",
  invariant_fail: "danger",
  invariant_pass: "success",
  state_write: "write",
  response_ignored: "write",
  timer_tick: "async",
  async_resolve: "async",
};

function eventLabel(kind: TraceEventKind): string {
  return kind.replaceAll("_", " ");
}

export function EventTimeline({
  events,
  highlightedEventId,
  running,
}: EventTimelineProps) {
  const start = events[0]?.atMs ?? 0;
  const timelineRef = useRef<HTMLOListElement>(null);
  const eventRefs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    const timeline = timelineRef.current;
    if (timeline) {
      timeline.scrollTop = timeline.scrollHeight;
    }
  }, [events.length]);

  useEffect(() => {
    if (!highlightedEventId) return;
    const target = eventRefs.current.get(highlightedEventId);
    target?.scrollIntoView?.({ block: "center" });
    target?.focus();
  }, [highlightedEventId]);

  return (
    <section className="instrument timeline-panel" aria-labelledby="timeline-title">
      <div className="instrument__head">
        <div>
          <p className="kicker">Step 03 · Runtime truth</p>
          <h2 id="timeline-title">Observed event trace</h2>
        </div>
        <span className={running ? "live-indicator is-live" : "live-indicator"}>
          <span aria-hidden /> {running ? "Capturing" : `${events.length} events`}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="scope-empty">
          <span className="scope-empty__beam" aria-hidden />
          <p>Trace armed. Select a prediction, then run the component.</p>
        </div>
      ) : (
        <ol
          className="timeline"
          aria-busy={running}
          aria-label="Runtime events"
          ref={timelineRef}
          role="log"
        >
          {events.map((event) => {
            const group = eventGroup[event.kind] ?? "default";
            return (
              <li
                className={`timeline__event timeline__event--${group}${event.id === highlightedEventId ? " is-highlighted" : ""}`}
                data-event-id={event.id}
                key={event.id}
                ref={(element) => {
                  if (element) eventRefs.current.set(event.id, element);
                  else eventRefs.current.delete(event.id);
                }}
                tabIndex={-1}
              >
                <span className="timeline__sequence">{String(event.sequence).padStart(2, "0")}</span>
                <span className="timeline__pin" aria-hidden />
                <div className="timeline__body">
                  <div className="timeline__meta">
                    <strong>{eventLabel(event.kind)}</strong>
                    <time>+{Math.round(event.atMs - start)} ms</time>
                  </div>
                  <p>{event.message}</p>
                  {event.data ? (
                    <div className="timeline__data">
                      {Object.entries(event.data).map(([key, value]) => (
                        <span key={key}>{key}={String(value)}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
