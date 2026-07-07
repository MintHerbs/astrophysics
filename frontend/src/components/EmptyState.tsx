import type { Step } from "@/lib/content";
import Icon from "./Icon";

interface Props {
  icon?: string;
  headline: string;
  body?: string;
  steps?: Step[];
}

export default function EmptyState({ icon = "download", headline, body, steps }: Props) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} />
      </div>
      <h3 className="type-title" style={{ margin: "0 0 6px" }}>
        {headline}
      </h3>
      {body ? (
        <p className="type-body muted" style={{ margin: "0 auto", maxWidth: 640 }}>
          {body}
        </p>
      ) : null}
      {steps && steps.length > 0 ? (
        <ol className="steps" aria-label="Steps to populate this source">
          {steps.map((s, i) => (
            <li className="step" key={i}>
              <span className="step-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="step-body">
                {s.code ? <code className="code">{s.text}</code> : s.text}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
