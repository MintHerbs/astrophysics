"use client";

import type { SourceKey } from "@/lib/types";
import { CONTENT } from "@/lib/content";
import Icon from "./Icon";

interface Props {
  source: SourceKey;
  onChange: (source: SourceKey) => void;
}

const ORDER: SourceKey[] = ["nasa", "mast"];

export default function SourceToggle({ source, onChange }: Props) {
  return (
    <div className="field" role="group" aria-label="Data source">
      <label id="source-toggle-label">Data source</label>
      <div className="segmented large" aria-labelledby="source-toggle-label">
        {ORDER.map((key) => {
          const c = CONTENT[key];
          const selected = key === source;
          return (
            <button
              key={key}
              type="button"
              className="segmented-btn"
              aria-pressed={selected}
              onClick={() => onChange(key)}
            >
              <Icon name={c.icon} />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
