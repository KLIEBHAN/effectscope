type SourcePanelProps = {
  label: string;
  source: string;
};

export function SourcePanel({ label, source }: SourcePanelProps) {
  return (
    <section className="instrument source-panel" aria-labelledby="source-title">
      <div className="instrument__head">
        <div>
          <p className="kicker">Checked-in variant</p>
          <h2 id="source-title">Source under test</h2>
        </div>
        <span className="instrument__status instrument__status--code">{label}</span>
      </div>
      <pre className="source-code" tabIndex={0}>
        <code>{source}</code>
      </pre>
    </section>
  );
}
