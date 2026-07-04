"use client";

import type { SourceData } from "@/lib/types";
import type { SourceContent } from "@/lib/content";
import Icon from "./Icon";

interface Props {
  dataset: SourceData;
  content: SourceContent;
}

export default function DictionaryView({ dataset, content }: Props) {
  return (
    <div className="stack">
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Provenance</h3>
            <p className="type-body muted" style={{ margin: 0 }}>
              {content.provenance.archive}
            </p>
          </div>
          <span className={`chip ${content.measurement.isTransmission ? "transmission" : "demo"}`}>
            <Icon name={content.measurement.isTransmission ? "verified" : "science"} />
            {content.badge}
          </span>
        </div>
        <hr className="divider" style={{ margin: "14px 0" }} />
        <dl className="kv">
          <dt>Product</dt>
          <dd>{content.provenance.productKind}</dd>
          <dt>Archive</dt>
          <dd>
            <a href={content.provenance.url} target="_blank" rel="noreferrer">
              {content.provenance.url}
            </a>
          </dd>
        </dl>
        {content.provenance.query ? (
          <div style={{ marginTop: 14 }}>
            <p className="type-label muted" style={{ margin: "0 0 6px" }}>
              {content.provenance.query.label}
            </p>
            <code className="code">{content.provenance.query.text}</code>
          </div>
        ) : null}
        {content.provenance.notes.length > 0 ? (
          <ul style={{ margin: "14px 0 0", paddingLeft: 20 }} className="type-body muted">
            {content.provenance.notes.map((n, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {n}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <ColumnTable
        title={content.tables.primaryTitle}
        columns={dataset.columns.primary}
        descriptions={content.tables.primary}
      />
      <ColumnTable
        title={content.tables.secondaryTitle}
        columns={dataset.columns.secondary}
        descriptions={content.tables.secondary}
      />
    </div>
  );
}

function ColumnTable({
  title,
  columns,
  descriptions,
}: {
  title: string;
  columns: string[];
  descriptions: Record<string, string>;
}) {
  return (
    <div className="card">
      <h3 className="card-title" style={{ marginBottom: 12 }}>
        {title}
      </h3>
      {columns.length === 0 ? (
        <p className="type-body muted" style={{ margin: 0 }}>
          This CSV was not found or has no header row yet.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: "34%" }}>Column</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col}>
                  <td>
                    <code>{col}</code>
                  </td>
                  <td>{descriptions[col] ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
