"use client";

import Icon from "./Icon";

export type ViewKey = "viewer" | "overview" | "dictionary";

interface Props {
  view: ViewKey;
  onChange: (view: ViewKey) => void;
}

const TABS: { key: ViewKey; label: string; icon: string }[] = [
  { key: "viewer", label: "Spectrograph", icon: "monitoring" },
  { key: "overview", label: "Dataset overview", icon: "dataset" },
  { key: "dictionary", label: "Data dictionary", icon: "table_chart" },
];

export default function NavTabs({ view, onChange }: Props) {
  return (
    <div className="tabs" role="tablist" aria-label="Views">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          className="tab"
          aria-selected={view === t.key}
          onClick={() => onChange(t.key)}
        >
          <Icon name={t.icon} />
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
