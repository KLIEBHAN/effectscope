# EffectScope – Umsetzungs- und Einreichungsplan

Stand: 18. Juli 2026  
Zieltermin: 21. Juli 2026, 18:00 CEST (interne Frist)  
Offizielle Frist: 22. Juli 2026, 02:00 CEST  
Kategorie: Education

## 1. Produktentscheidung

### Kurzpitch

EffectScope ist ein interaktives React-Lernlabor. Lernende prognostizieren das Verhalten eines fehlerhaften `useEffect`, führen eine echte instrumentierte React-Komponente aus und sehen beobachtete Render-, Effect-, Cleanup- und Async-Ereignisse als normalisierte Zeitachse. GPT-5.6 vergleicht Prognose, Quelltext und Laufzeitspur, identifiziert das konkrete Missverständnis und gibt den kleinsten hilfreichen Hinweis.

### Problem

`useEffect`-Fehler sind schwer zu lernen, weil Ursache und Wirkung zeitlich getrennt auftreten. Quelltext allein zeigt nicht, wann Cleanup läuft, welche Closure ein Callback sieht oder warum eine alte Fetch-Antwort neueren State überschreibt. Allgemeine Chat-Erklärungen kennen zudem nicht zwingend die tatsächlich beobachtete Ausführung.

### Lösung

EffectScope verbindet drei Beweise:

1. Erwartung des Lernenden,
2. reproduzierbar erzeugte Spur aus tatsächlicher React-Ausführung,
3. GPT-5.6-Feedback mit Verweisen auf konkrete Spurereignisse.

GPT-5.6 simuliert React nicht. Szenario-Engine erzeugt Wahrheit; Modell erklärt Diskrepanz. Diese Trennung ist zentrale technische und pädagogische Idee.

### Zielgruppe

- React-Einsteiger mit Grundkenntnissen in Komponenten und State
- Bootcamps und Hochschulkurse
- Mentoren, die asynchrone React-Fehler sichtbar erklären wollen

### Erfolgsversprechen

Nach einer Sitzung kann Lernender bei mindestens einem Szenario:

- fehlerhaftes Verhalten korrekt vorhersagen,
- Ursache anhand Zeitachse benennen,
- kleinsten wirksamen Fix auswählen,
- korrigierte Spur vom ursprünglichen Fehler unterscheiden.

## 2. Ausgangslage und Beweisführung

Vorhandene Basis:

- Quelle: lokal importierter useEffect-Lab-Snapshot; ursprünglicher
  Dateisystempfad für Veröffentlichung entfernt
- React 19, TypeScript, Vite, Framer Motion
- sieben funktionierende deutschsprachige Lektionen
- wiederverwendbare Komponenten: `CodeBlock`, `EffectLog`, `LessonLayout`
- vorhandene Beispiele für Dependencies, Cleanup, Fetch-Races und Endlosschleifen
- `npm run build` und `npm run lint` bestanden am 18. Juli 2026
- importierte Dateien tragen Zeitstempel vom 15. und 16. Juli 2026 und liegen damit im Einreichungszeitraum

Aktuelles Nachweisrisiko:

- Ursprungsrepository besitzt noch keinen Commit; alle Dateien sind untracked.
- Dateizeitstempel allein sind schwächer als Git-Historie und Codex-Session.

Pflichtmaßnahmen vor Implementierung:

1. Eigentum und Veröffentlichungsrecht an Basiscode bestätigen.
2. Basis unverändert in neuen EffectScope-Ordner kopieren.
3. `BASELINE.md` mit Quelle, Dateizeitstempeln, vorhandenen Funktionen und Build-Ergebnis anlegen.
4. Basis als ersten Commit einchecken; Historie nicht nachträglich umdatieren.
5. gesamte Kernimplementierung in einer primären Codex-Session durchführen.
6. nach jedem Meilenstein kleinen, aussagekräftigen Commit erstellen.
7. `docs/BUILD_LOG.md` mit Datum, Session, Entscheidungen und Commit-Hashes pflegen.
8. vor Einreichung `/feedback` in primärer Session ausführen und Session-ID sichern.

## 3. MVP-Umfang

### Muss enthalten

1. Englische, responsive Weboberfläche ohne Anmeldung.
2. Zwei ausführbare Diagnose-Szenarien:
   - Missing Cleanup: Timer läuft nach Remount mehrfach.
   - Fetch Race: langsame alte Antwort überschreibt aktuelle Auswahl.
3. Pro Szenario:
   - kompakte Problemstellung,
   - sichtbarer Quelltext aus eingecheckter Variant-ID (`bug`, `fix`, `distractor`),
   - eine Multiple-Choice-Prognose vor Ausführung,
   - reproduzierbarer Start/Reset-Ablauf,
   - normalisierte Ereigniszeitachse,
   - eine korrekte Reparaturstrategie plus mindestens einen plausiblen Distraktor,
   - erneuter Lauf zum Beweis des Fixes.
4. GPT-5.6-Analyse in beiden Pflichtszenarien aus Quelltext, Prognose, gewähltem Fix und Spur.
5. Modellantwort mit Urteil, Missverständnis, Spurbelegen, Hinweis und Kontrollfrage.
6. direkte Verknüpfung: Klick auf Modellbeleg markiert Ereignis in Zeitachse.
7. öffentliche Demo, reproduzierbarer lokaler Start, Tests und englisches README.

### Soll enthalten

- drittes Szenario Stale Closure, nur falls bis 20. Juli 14:00 CEST stabil
- Fortschrittsanzeige für Pflichtszenarien
- lokal gespeicherter letzter Stand
- reduzierte Animation bei `prefers-reduced-motion`
- verständliche Fehleranzeige bei Modell-Timeout
- Tastaturbedienung und sinnvolle Screenreader-Beschriftungen

### Bewusst ausgeschlossen

- beliebiger JavaScript-/React-Code aus Nutzereingaben
- Monaco, Sandpack oder eigener Compiler
- Chatverlauf mit freier Texteingabe
- Benutzerkonten, Datenbank oder Teamfunktionen
- automatische Codeänderung durch Modell
- mehr als zwei Pflichtszenarien
- vollständige Lernplattform oder Zertifikate
- deutsche Lokalisierung vor Einreichung

Begründung: beliebige Codeausführung, freie Chats und Kontosysteme erhöhen Sicherheits-, Test- und Zeitrisiko ohne Kernthese besser zu demonstrieren.

## 4. Primärer Demoablauf

Szenario: Fetch Race.

1. Nutzer sieht Bug-Code ohne `AbortController`.
2. Nutzer prognostiziert: „Nur neueste Auswahl wird angezeigt.“
3. Nutzer startet langsame Anfrage B und unmittelbar schnelle Anfrage C.
4. Zeitachse zeigt:
   - Effect B startet,
   - Effect C startet,
   - Antwort C schreibt State,
   - verspätete Antwort B schreibt veralteten State,
   - Invariant `latest request wins` schlägt fehl.
5. GPT-5.6 bewertet Prognose als falsch und referenziert konkrete Event-IDs.
6. Nutzer wählt `AbortController in cleanup`.
7. Erneuter Lauf zeigt `CLEANUP`, `ABORT` und nur gültigen State-Write.
8. GPT-5.6 bestätigt Fix und stellt Transferfrage.

Dieser Ablauf muss ohne Erklärung von Entwicklern verständlich und in weniger als 90 Sekunden vorführbar sein.

## 5. Pädagogisches Design

Jedes Szenario folgt gleicher Schleife:

`Predict -> Run -> Observe -> Explain -> Repair -> Prove`

Regeln:

- Prognose ist vor erstem Lauf verpflichtend.
- GPT-5.6 nennt nicht sofort vollständige Lösung.
- Erstes Feedback enthält kleinsten Hinweis, der nächste eigene Denkschritt ermöglicht.
- Zeitachse bleibt Quelle für technische Wahrheit.
- Nach Reparatur wird gleiche Interaktionsfolge wiederholt.
- Erfolgszustand verlangt korrigierte Spur, nicht nur richtige Antwortauswahl.

## 6. Technische Architektur

### Laufzeit

- Frontend: React 19 + TypeScript + Vite
- Hosting/API: Vercel Static Deployment plus Serverless Function
- Modellzugriff: OpenAI Responses API über offiziellen Node-SDK
- Modell: per `OPENAI_MODEL` konfigurierbares GPT-5.6-Modell; Standard `gpt-5.6-terra`
- Validierung: Zod an Client-/Server-Grenzen
- Unit-/Komponententests: Vitest + Testing Library
- End-to-End: Playwright
- CI: GitHub Actions mit Build, Lint, Unit und einem Chromium-E2E

### Komponenten

```text
AppShell
├── ScenarioNavigation
├── ScenarioWorkspace
│   ├── ProblemCard
│   ├── PredictionPanel
│   ├── SourcePanel
│   ├── ScenarioControls
│   ├── EventTimeline
│   ├── RepairPanel
│   └── CoachPanel
└── ProgressSummary

Domain
├── ScenarioDefinition
├── ScenarioRunner
├── TraceEvent
├── InvariantEvaluator
└── LearningAttempt

Infrastructure
├── /api/analyze
├── OpenAIClient
├── FeedbackSchema
└── AttemptStorage (Stretch; localStorage only)
```

### Architekturgrenzen

- Wahrheitsquelle ist Ausführung eingecheckter React-Varianten in isoliertem `ScenarioHarness`.
- Harness instrumentiert echte Effect-, Cleanup-, Timer-, Request- und State-Übergänge.
- Ein injizierbarer Scheduler kontrolliert Verzögerungen; er ersetzt nicht Reacts Effect-Reihenfolge.
- Szenario-Runner normalisiert beobachtete Events, darf Reihenfolge oder Ergebnis nicht erfinden.
- Läuft Harness nicht gegen echte React-Komponenten, muss Produkttext „pedagogical simulator“ statt „runtime trace“ sagen.
- Invariant-Evaluator bestimmt deterministisch Pass/Fail.
- UI interpretiert keine Modelltexte als technische Wahrheit.
- API akzeptiert nur bekannte `scenarioId`-Werte und begrenzte strukturierte Daten.
- OpenAI-Schlüssel bleibt ausschließlich serverseitig.
- Modellantwort wird gegen festes Schema validiert; ungültige Antwort erscheint nicht ungeprüft.
- Diagnose-Harness läuft mit Production-Semantik ohne globalen Development-Strict-Mode-Doppellauf. Strict Mode wird separat erklärt und getestet, nicht aus Timeline gefiltert.

### Geplante Modulstruktur

```text
src/
├── app/
│   └── App.tsx
├── domain/
│   ├── trace.ts
│   ├── invariant.ts
│   └── attempt.ts
├── scenarios/
│   ├── fetch-race/
│   │   ├── FetchRaceHarness.tsx
│   │   ├── variants.ts
│   │   └── oracle.ts
│   ├── missing-cleanup/
│   │   ├── MissingCleanupHarness.tsx
│   │   ├── variants.ts
│   │   └── oracle.ts
│   └── registry.ts
├── features/diagnose/
│   ├── PredictionPanel.tsx
│   ├── EventTimeline.tsx
│   ├── RepairPanel.tsx
│   └── CoachPanel.tsx
├── infrastructure/
│   ├── analyzeAttempt.ts
│   └── feedbackSchema.ts
└── test/
    └── controlledScheduler.ts
api/
└── analyze.ts
```

`variants.ts` enthält versionierte IDs und sichtbare Snippets. Harness-Verhalten und Snippet werden im selben Szenariomodul geändert. Snapshot- und Oracle-Tests verhindern unbeabsichtigtes Auseinanderlaufen.

## 7. Datenverträge

### TraceEvent

```ts
type TraceEventKind =
  | "render"
  | "effect_start"
  | "timer_start"
  | "timer_tick"
  | "timer_stop"
  | "async_start"
  | "async_resolve"
  | "cleanup"
  | "abort"
  | "value_read"
  | "state_write"
  | "stale_write"
  | "invariant_pass"
  | "invariant_fail";

type TraceEvent = {
  id: string;
  sequence: number;
  atMs: number;
  kind: TraceEventKind;
  actor: string;
  message: string;
  data?: Record<string, string | number | boolean>;
};
```

`atMs` dient Anzeige. Semantik folgt `sequence`, damit Tests nicht von Timer-Jitter abhängen.

### Analyseanfrage

```ts
type AnalyzeAttemptRequest = {
  scenarioId: "missing-cleanup" | "fetch-race";
  predictionId: string;
  repairId: string | null;
  sourceVariant: string;
  invariantPassed: boolean;
  trace: TraceEvent[];
};
```

### Modellantwort

```ts
type CoachFeedback = {
  verdict: "correct" | "partly_correct" | "incorrect";
  misconception: string;
  evidence: Array<{
    eventId: string;
    explanation: string;
  }>;
  hint: string;
  transferQuestion: {
    prompt: string;
    options: string[];
  };
};
```

Validierungsregeln:

- maximal 80 Trace-Events pro Anfrage
- maximal 12 KB JSON-Body
- `eventId` in Antwort muss in gesendeter Spur existieren
- maximal drei Belege
- Freitextfelder mit engen Längenlimits
- keine Systemprompts oder freie Nutzernachrichten im Request
- `sourceVariant` muss registrierte ID wie `fetch-race/bug-v1` sein; Server lädt Szenariokontext selbst und vertraut keinem Client-Quelltext

## 8. GPT-5.6-Nutzung

### Aufgabe des Modells

GPT-5.6 soll:

- Diskrepanz zwischen Prognose und Spur erklären,
- wahrscheinlichstes mentales Modell benennen,
- Belege ausschließlich aus übergebenen Events wählen,
- Hinweis an Lernstand und gewählten Fix anpassen,
- eine kurze Transferfrage erzeugen.

GPT-5.6 soll nicht:

- Ausführung erfinden,
- Pass/Fail bestimmen,
- Quelltext autonom ausführen,
- vollständige Reparatur vor erstem Lernversuch liefern,
- interne Reasoning-Ketten ausgeben.

### Promptstruktur

1. stabile Systemanweisung mit Rolle, pädagogischen Regeln und Ausgabeschema
2. serverseitige Szenariobeschreibung aus Allowlist
3. strukturierte Versuchsdaten
4. strukturierte Ausgabe per JSON-Schema

### Betriebsgrenzen

- niedrige Ausgabelänge
- 10-Sekunden-Timeout
- höchstens ein Retry bei Schemafehler oder transientem Fehler
- erneute identische Anfrage im Browser zwischenspeichern
- API-Budget und Rate-Limit beim OpenAI-Projekt setzen
- `store: false`, sofern API und SDK dies unterstützen
- freundlicher Fehlerzustand; deterministisches Lernen bleibt ohne Modellantwort benutzbar

## 9. Szenario-Spezifikation und Oracles

Jede Variante besitzt eingecheckte ID, sichtbares Snippet, echte React-Harness-Komponente und erwartete Golden Trace. Unit-Tests vergleichen semantische Sequenz; `atMs` bleibt unberücksichtigt.

### A. Fetch Race – Pflicht und primärer Demo-Pfad

Varianten:

- `fetch-race/bug-v1`: Request ohne Cancellation
- `fetch-race/fix-abort-v1`: `AbortController` im Effect-Cleanup
- `fetch-race/distractor-loading-v1`: nur Ladeindikator, Race bleibt bestehen

Interaktion:

- Auswahl B startet Request mit kontrollierter Verzögerung 1200 ms.
- unmittelbare Auswahl C startet Request mit 200 ms.

Golden Trace Bug:

```text
1  render(B)
2  effect_start(B)
3  async_start(request-B)
4  render(C)
5  effect_start(C)
6  async_start(request-C)
7  async_resolve(request-C)
8  state_write(C, latest=true)
9  async_resolve(request-B)
10 stale_write(B, latest=false)
11 invariant_fail(latest-request-wins)
```

Golden Trace Fix:

```text
1  render(B)
2  effect_start(B)
3  async_start(request-B)
4  render(C)
5  cleanup(B)
6  abort(request-B)
7  effect_start(C)
8  async_start(request-C)
9  async_resolve(request-C)
10 state_write(C, latest=true)
11 invariant_pass(latest-request-wins)
```

Erfolgsinvariant:

- nur Antwort aktueller Auswahl darf sichtbaren State schreiben
- abgebrochener Request darf kein späteres Resolve-/Write-Event erzeugen

### B. Missing Cleanup – Pflicht

Varianten:

- `missing-cleanup/bug-v1`: Interval ohne Cleanup
- `missing-cleanup/fix-clear-v1`: `clearInterval` im Cleanup
- `missing-cleanup/distractor-restart-v1`: zusätzlicher Timerstart ohne Aufräumen

Interaktion:

- erste Instanz mounten und einen Tick auslösen
- Instanz unmounten
- zweite Instanz mounten und nächsten kontrollierten Tick auslösen

Golden Trace Bug:

```text
1  render(instance-1, mounted=true)
2  effect_start(instance-1)
3  timer_start(timer-1)
4  timer_tick(timer-1)
5  render(instance-1, mounted=false)
6  render(instance-2, mounted=true)
7  effect_start(instance-2)
8  timer_start(timer-2)
9  timer_tick(timer-1)
10 timer_tick(timer-2)
11 invariant_fail(single-active-timer)
```

Golden Trace Fix:

```text
1  render(instance-1, mounted=true)
2  effect_start(instance-1)
3  timer_start(timer-1)
4  timer_tick(timer-1)
5  render(instance-1, mounted=false)
6  cleanup(instance-1)
7  timer_stop(timer-1)
8  render(instance-2, mounted=true)
9  effect_start(instance-2)
10 timer_start(timer-2)
11 timer_tick(timer-2)
12 invariant_pass(single-active-timer)
```

Erfolgsinvariant:

- höchstens ein aktiver Timer
- unmounted Instanz erzeugt keine späteren Timer-Ticks

### C. Stale Closure – Stretch nach stabiler Einreichung

Nur beginnen, wenn beide Pflichtszenarien, GPT-Coach, Deployment und E2E bis 20. Juli 14:00 CEST grün sind.

Vorgesehene Varianten:

- `stale-closure/bug-v1`: Interval mit `[]` liest initialen Wert
- `stale-closure/fix-functional-v1`: funktionales State-Update

Zusätzlicher Tracebedarf:

- `value_read` enthält `capturedValue` und `visibleValue`
- Invariant schlägt fehl, sobald Callback alten Wert liest

## 10. UI-Plan

### Informationsarchitektur

- Landing/Intro: Problem, sechs-Schritt-Lernschleife, Startknopf
- Workspace: ein Szenario pro Ansicht
- linke Navigation: zwei Pflichtszenarien plus Fortschritt; Stretch-Szenario nur bei Fertigstellung sichtbar
- Hauptbereich:
  - oben Problem und Vorhersage
  - Mitte Source/Controls und Timeline nebeneinander
  - unten Repair und GPT-Coach

### Visuelle Richtung

- bestehende dunkle Laborästhetik übernehmen
- Eventtypen durch Farbe, Symbol und Text unterscheiden
- Sequenznummern statt nur Uhrzeiten hervorheben
- Fehlerzustand `stale_write` klar, aber nicht ausschließlich rot kodieren
- Coach-Belege als klickbare Chips mit Event-ID
- Animationen kurz und funktional; keine dekorative Zeitverschwendung

### Responsivität

- Desktop: Quelltext und Timeline zweispaltig
- Tablet: Panels gestapelt, Navigation horizontal/kompakt
- Mobil: lineare Lernschleife, Sticky-Fortschritt, kein horizontaler Codeüberlauf

### Sprache

- Produkt und alle Einreichungsartefakte auf Englisch
- einfache Sätze; React-Fachbegriffe bleiben technisch exakt
- vorhandene deutsche Lektionen nur übernehmen, wenn rechtzeitig vollständig übersetzt; Diagnose-MVP hat Vorrang

## 11. Implementierungsreihenfolge

### Meilenstein 0 – belastbare Basis

- neuen Git-Stand aus vorhandener App erzeugen
- Eigentumscheck dokumentieren
- `BASELINE.md`, Lizenzentscheidung und `docs/BUILD_LOG.md`
- Paketname und Branding auf EffectScope ändern
- englische MVP-Navigation anlegen
- erforderliche Pakete installieren: `openai`, `zod`, `vitest`, Testing Library und Playwright/Chromium
- GitHub-Actions-Workflow für Build, Lint und Unit anlegen; E2E nach goldenem Pfad ergänzen

Abnahme:

- sauberer erster Commit
- Build und Lint grün
- Unterschiede zur Basis nachvollziehbar

### Meilenstein 1 – goldener Fetch-Race-Durchstich

- Domain-Typen und Szenariozustandsmaschine
- reproduzierbare Fake-Requests über injizierbaren Scheduler
- Prognose-Gate
- Timeline
- zwei Reparaturvarianten
- Invariant-Evaluator

Abnahme:

- Bug- und Fix-Lauf deterministisch reproduzierbar
- Unit-Tests prüfen exakte Eventreihenfolge
- kompletter Lernfluss funktioniert noch ohne GPT

### Meilenstein 2 – GPT-Coach

- serverseitige API-Funktion
- Request- und Response-Schema
- OpenAI-Integration
- Event-ID-Validierung
- Lade-, Timeout- und Fehlerzustände
- CoachPanel mit Timeline-Verknüpfung

Abnahme:

- live GPT-5.6-Antwort gegen echten Trace
- Modell kann unbekannte Event-ID nicht anzeigen
- API-Key fehlt vollständig aus Browserbundle und Logs

### Meilenstein 3 – zweites Pflichtszenario

- Missing Cleanup
- gemeinsame Runner-/UI-Abstraktionen erst nach zweitem Szenario extrahieren

Abnahme:

- beide Szenarien nutzen gleichen Lernablauf
- Missing Cleanup besitzt Bug-, Distraktor- und erfolgreichen Fix-Pfad
- GPT-Coach analysiert auch Missing Cleanup anhand echter Events
- manueller GPT-Happy-Path für Missing Cleanup ist dokumentiert, selbst wenn eigener E2E aus Zeitgründen entfällt

### Meilenstein 4 – Produktqualität

- englische Texte
- Tastatur und Screenreader
- responsive Layouts
- reduzierte Bewegung
- ein Chromium-E2E-Happy-Path für Fetch Race
- ein Chromium-E2E für GPT-Timeout/Fehlerzustand
- manuelle mobile Prüfung; Firefox/WebKit erst nach Einreichung

### Meilenstein 5 – Deployment und Einreichung

- öffentliches Deployment
- Produktions-Smoke-Test
- README, Architekturdiagramm, Screenshots und Testanleitung
- Build-Log und Codex/GPT-5.6-Erklärung
- Video aufnehmen und öffentlich hochladen
- Devpost-Entwurf vollständig prüfen
- `/feedback`-Session-ID eintragen

## 12. Zeitplan und Abbruchkriterien

### Samstag, 18. Juli

- Meilenstein 0 vollständig
- Fetch-Race-Durchstich bis Invariant-Evaluator
- erste sichtbare Timeline

Abbruchsignal: Fetch-Race ist bis Tagesende nicht reproduzierbar. Dann keine GPT-Integration beginnen; Runner vereinfachen.

### Sonntag, 19. Juli

- Fetch-Race-Lernfluss fertig
- GPT-Coach live
- Missing Cleanup fertig
- Unit- und API-Vertragstests

Abbruchsignal: GPT-API ist bis 16:00 nicht stabil. Dann Prompt/Schema radikal kürzen; keine freie Transferfrage.

### Montag, 20. Juli

- beide Pflichtszenarien und GPT-Coach stabil
- UX, Englisch, Accessibility
- Deployment und E2E
- README-Rohfassung und Screenshots

Stretch-Gate 14:00: Stale Closure nur beginnen, wenn Deployment, beide Pflichtszenarien, Live-GPT, Unit-Tests und Chromium-E2E grün sind. Sonst bleibt es dokumentierte Nachfolgeidee.

### Dienstag, 21. Juli

- 09:00–12:00: finale QA, Lizenz, Build-Log, `/feedback`
- 12:00–16:00: Video aufnehmen, schneiden, hochladen
- 16:00–18:00: Devpost prüfen und einreichen
- 18:00: interne harte Frist; danach nur Submission-Verifikation

Keine Kernfunktion nach Dienstag 09:00 beginnen.

## 13. Teststrategie

### Unit

- echte React-Harness-Komponenten erzeugen erwartete Golden Trace für Bug und Fix
- Scheduler-/Timer-Jitter verändert Sequenzsemantik nicht
- Invariants erkennen genau definierten Fehler
- sichtbare Source-Variant-ID, Harness-Variante und Oracle stimmen überein
- Request- und Response-Schemas akzeptieren gültige, verwerfen ungültige Daten
- Modellbelege dürfen nur vorhandene Event-IDs nennen

### Komponenten

- Start bleibt gesperrt, bis Prognose gewählt
- Reset löscht Events und beendet laufende Timer/Requests
- Repair-Auswahl ändert sichtbaren Source-Variant
- Coach-Beleg fokussiert korrektes Timeline-Event
- Fehlerzustand erhält deterministische Lernfunktion

### API-Vertrag

- unbekanntes Szenario -> 400
- zu großer Body -> 413
- ungültige Modellantwort -> kontrollierter 502-Fehler
- Timeout -> kontrollierter 504-Fehler
- API-Key wird nicht in Antwort oder Logs ausgegeben

### End-to-End

- Fetch-Race: falsche Prognose -> Bug-Spur -> Coach -> Abort-Fix -> Pass
- GPT-Timeout: deterministische Spur bleibt nutzbar und Retry erscheint
- ausschließlich Chromium vor Einreichung

### Manuell vor Einreichung

- frischer Browser ohne Local Storage
- Produktionsdeployment mit echtem GPT-5.6
- Missing Cleanup komplett per Tastatur durchspielen
- mobile Viewport ohne horizontales Seiten-Scrolling
- langsames Netzwerk und API-Timeout
- README-Setup in sauberem Checkout
- YouTube-Video öffentlich, englischer Ton verständlich, Dauer höchstens drei Minuten

## 14. Definition of Done

Produkt gilt als fertig, wenn:

- genau zwei Pflichtszenarien vollständig funktionieren; Stale Closure ist kein Fertigkriterium,
- jeder Bug deterministisch sichtbar und jeder angebotene korrekte Fix beweisbar ist,
- GPT-5.6 in beiden Pflichtszenarien echten Lernversuch strukturiert analysiert,
- Video zeigt, wie GPT-Feedback nächsten Lernschritt materiell verändert,
- Modellbelege auf existierende Timeline-Events zeigen,
- öffentliches Deployment ohne Login funktioniert,
- Build, Lint, Unit und E2E grün sind,
- README frischen lokalen Start und Test erklärt,
- README grenzt Baseline und neue Build-Week-Arbeit mit Commit-/Session-Nachweisen ab,
- Eigentum, Lizenz und Fremdabhängigkeiten geklärt sind,
- Codex-Build-Log und primäre `/feedback`-Session-ID vorhanden sind,
- Repository ist öffentlich mit passender Lizenz oder privat und mit `testing@devpost.com` sowie `build-week-event@openai.com` geteilt,
- öffentliches YouTube-Video dauert höchstens drei Minuten, hat englischen Voiceover und nennt Projekt, Codex-Nutzung und GPT-5.6-Nutzung,
- Devpost-Einreichung vor interner Frist bestätigt wurde.

## 15. Einreichungsartefakte

### README-Struktur

1. Problem und Ein-Satz-Lösung
2. öffentlicher Demo-Link
3. 60-Sekunden-Testpfad
4. Features und Szenarien
5. Architektur
6. GPT-5.6-Nutzung zur Laufzeit
7. Zusammenarbeit mit Codex
8. neue Arbeit während Build Week
9. lokales Setup
10. Tests
11. Datenschutz und Grenzen
12. Lizenz

### Video-Skript, Ziel 2:40

- 0:00–0:15: Lernproblem und EffectScope-Pitch
- 0:15–0:35: Prognose im Fetch-Race-Szenario
- 0:35–1:05: Bug ausführen und Spur lesen
- 1:05–1:30: GPT-5.6-Feedback mit konkreten Eventbelegen
- 1:30–1:55: Fix wählen und erfolgreiche Spur beweisen
- 1:55–2:15: Missing-Cleanup-Szenario zeigen
- 2:15–2:35: Codex-Entwicklungsworkflow und GPT-5.6-Architektur
- 2:35–2:40: Schlussbild und Demo-URL

### Formale Einreichungsprüfung

- Projektbeschreibung und Kategorie Education gewählt
- öffentliches YouTube-Video, Ziel 2:40, englischer Voiceover
- Video zeigt funktionierendes Projekt und erklärt konkret Codex- sowie GPT-5.6-Nutzung
- Repository-URL testbar; öffentlich mit Lizenz oder privat für beide Jury-Adressen freigegeben
- README enthält Setup, Beispieldaten falls nötig, 60-Sekunden-Testpfad und Build-Week-Deltanachweis
- öffentliches Deployment oder Test-Build bleibt während Juryphase kostenlos erreichbar
- primäre `/feedback`-Session-ID im Formular

### Devpost-Kernaussage

> EffectScope does not ask an AI to guess what React did. It records what happened, then uses GPT-5.6 to turn the mismatch between prediction and execution into a personalized learning moment.

## 16. Risiken und Gegenmaßnahmen

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| Keine bestehende Git-Historie | schwacher Entwicklungsnachweis | ehrlicher Baseline-Commit, Zeitstempel, Build-Log, primäre Codex-Session |
| Scope wächst zum Code-Editor | Termin gefährdet | nur geprüfte Source-Varianten und Steuerungen |
| React Strict Mode erzeugt doppelte Events | lokale Spur weicht von Produktion ab | Diagnose-Harness ohne globalen Dev-Doppellauf; Strict Mode separat erklären und testen |
| Timer/Fetch-Flakiness | inkonsistente Demo | injizierbarer Scheduler, Sequenznummern, kontrollierte Verzögerungen |
| Modell halluziniert Ereignisse | falsches Lernfeedback | Event-ID-Allowlist und serverseitige Response-Validierung |
| Modelllatenz oder Ausfall | Demo stockt | kurze Inputs, Timeout, ein Retry, sichtbarer Fehlerzustand, deterministischer Kern bleibt nutzbar |
| öffentlicher API-Endpunkt wird missbraucht | Kosten | strukturierte Allowlist-Anfragen, Body-Limit, Projektbudget, Rate-Limit, niedrige Tokenlimits |
| Englische Übersetzung kostet Zeit | schlechte Juryverständlichkeit | nur Diagnose-MVP vollständig Englisch; alte Lektionen nachrangig |
| Video wird zu spät erstellt | formale Disqualifikation | Dienstag 12:00 Feature-Freeze, 16:00 Uploadziel |
| Rechte am Basiscode unklar | Einreichung unzulässig | vor Veröffentlichung Eigentumscheck; sonst neu implementieren statt kopieren |

## 17. Harte Entscheidungen

- Education ist Kategorie.
- Produkt heißt vorläufig EffectScope.
- Diagnosefluss ist Hauptprodukt; bestehende Lektionen sind optionaler Bonus.
- englische Oberfläche hat Vorrang.
- zwei feste Pflichtszenarien statt beliebiger Codeausführung; Stale Closure bleibt Stretch.
- echte instrumentierte React-Ausführung liefert Events; deterministischer Invariant-Evaluator entscheidet Pass/Fail; GPT-5.6 erklärt.
- `gpt-5.6-terra` ist kostengünstiger Standard, Modell bleibt konfigurierbar.
- öffentliche Demo ohne Login.
- interner Einreichungsschluss acht Stunden vor offizieller Frist.

## 18. Subagenten-Review und Entscheidung

Unabhängiges Review am 18. Juli 2026: No-Go für ursprünglichen Umfang, Conditional-Go nach Kürzung.

Übernommene P0/P1-Änderungen:

- zwei Pflichtszenarien statt drei; Widerspruch in Definition of Done entfernt
- echte React-Harness-Ausführung als explizite Wahrheitsquelle
- genaue Varianten-IDs, Golden Traces und Invariants pro Pflichtszenario
- Stale Closure als gegatetes Stretch-Ziel
- GitHub Actions statt offenem CI-Wahlpunkt
- Chromium-only E2E vor Einreichung
- GPT-5.6 muss in beiden Pflichtszenarien materiellen Lernschritt erzeugen
- vollständige Devpost-Formalkriterien ergänzt
- Build-Week-Deltanachweis im README zum Abnahmekriterium gemacht

Nicht übernommen:

- nur ein GPT-Pfad. Begründung: gleiche abgesicherte API soll beide Szenarien analysieren; dadurch ist Modellnutzung klar wesentlich statt dekorativ.

Finales Review-Verdikt: Conditional-Go. Durchführung nur in festgelegter Reihenfolge; Stale Closure und sonstige Soll-Ziele entfallen sofort bei Terminabweichung.

## 19. Offizielle Referenzen

- Regeln: https://openai.devpost.com/rules
- FAQ: https://openai.devpost.com/details/faqs
- Challenge: https://openai.devpost.com/
- OpenAI Build Week: https://openai.com/build-week/
