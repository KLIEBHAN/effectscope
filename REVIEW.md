# Subagenten-Review des EffectScope-Plans

Datum: 18. Juli 2026  
Reviewer: unabhängiger Critic-Subagent  
Geprüft: `PLAN.md` und vorhandene `useEffect Lab`-Basis  
Dateiänderungen durch Reviewer: keine

## Ursprüngliches Verdikt

**No-Go** für ursprünglichen Umfang bis 21. Juli 2026, 18:00 CEST.

**Conditional-Go** bei folgenden Kürzungen und Präzisierungen:

- zwei Pflichtszenarien statt drei
- ein goldener GPT-Pfad zuerst; Wiederverwendung nur nach Stabilität
- Chromium-only E2E
- Build, Lint, Unit und ein primärer E2E als Pflicht
- kein Firefox-/WebKit-Test vor Einreichung

## Priorisierte Funde

### P0

1. Scope-Widerspruch: drei Szenarien waren Pflicht, Definition of Done erlaubte zwei.
2. „Echte Laufzeitspur“ war nicht belegt. Plan erklärte Normalisierung, aber nicht, ob Events aus echter React-Ausführung stammen.
3. Basis passt nicht direkt zu geplanten Bug-Szenarien: Fetch und Cleanup zeigen bereits Fixe; Stale Closure fehlt vollständig.
4. Infrastrukturaufwand war unterschätzt: Basis besitzt keine OpenAI-, Zod-, Test-, CI- oder Serverless-Abhängigkeiten.

### P1

1. Trace-Schema konnte Closure-Lesezugriffe nicht ausdrücken.
2. Ein einziger echter GPT-Versuch wäre für Jurywirkung zu schwach.
3. Dateizeitstempel allein reichen nicht als belastbarer Build-Week-Nachweis.

### P2

1. CI-Ziel war mit GitHub oder Forgejo offen.
2. Drei Browser-Engines waren für Frist unangemessen.
3. Vorhandenes `EffectLog` mit Wall-Clock-Zeit und globalen IDs eignet sich nicht als deterministischer Oracle-Unterbau.

## Einarbeitung

| Fund | Entscheidung | Umsetzung im Plan |
|---|---|---|
| Drei-vs.-zwei-Widerspruch | übernommen | genau zwei Pflichtszenarien; Stale Closure Stretch |
| Unklare Wahrheitsquelle | übernommen | echte instrumentierte React-Harness-Komponenten; Normalisierung darf nichts erfinden |
| Fehlende Oracles | übernommen | Varianten-IDs, Golden Traces und Invariants für Fetch Race und Missing Cleanup |
| Infrastruktur unterschätzt | übernommen | Pakete und CI bereits in Meilenstein 0; Scope an anderer Stelle gekürzt |
| Zu dünnes Trace-Schema | übernommen | Timer-, Async-Resolve- und Value-Read-Events ergänzt |
| Schwacher GPT-Nachweis | verschärft | GPT-5.6 analysiert beide Pflichtszenarien und muss im Video Lernschritt verändern |
| Schwache Historie | übernommen | ehrlicher Baseline-Commit, `BASELINE.md`, Build-Log, Session- und Commit-Nachweise |
| Offenes CI-Ziel | übernommen | GitHub Actions festgelegt |
| Zu breite Browsermatrix | übernommen | Chromium-only E2E vor Einreichung |
| Formale Devpost-Lücken | übernommen | Repo-Freigabe, YouTube, Voiceover, Englisch und `/feedback` explizit ergänzt |

## Finales Verdikt nach Einarbeitung

**Conditional-Go.** Plan ist ausführbar, falls Reihenfolge eingehalten wird. Stale Closure, Local Storage und zusätzliche Browser entfallen ohne Diskussion, sobald Pflichtpfad hinter Zeitplan liegt.

Größtes verbleibendes Risiko: API-/Deployment-Infrastruktur entsteht komplett neu. Deshalb muss Fetch-Race-Durchstich vor zweitem Szenario und vor visueller Politur funktionieren.

## Re-Review nach Einarbeitung

Reviewer-Verdikt: **PASS**.

Frühere P0-Funde sind behoben. Letzte Hinweise wurden ebenfalls eingearbeitet:

- MVP-API akzeptiert zunächst nur zwei Pflichtszenarien.
- sichtbarer Quelltext ist bereits im MVP an eingecheckte Varianten-IDs gebunden.
- Missing Cleanup erhält expliziten manuellen GPT-Happy-Path, auch ohne separaten E2E.
