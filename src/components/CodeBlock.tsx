import "./CodeBlock.css";

type Props = {
  code: string;
  caption?: string;
};

export function CodeBlock({ code, caption }: Props) {
  return (
    <figure className="code-block">
      {caption ? <figcaption>{caption}</figcaption> : null}
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
