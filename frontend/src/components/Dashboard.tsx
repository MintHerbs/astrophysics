"use client";

import { useMemo, useState } from "react";
import type { SourceData, SourceKey } from "@/lib/types";
import { CONTENT } from "@/lib/content";
import SourceToggle from "./SourceToggle";
import NavTabs, { type ViewKey } from "./NavTabs";
import ViewerView from "./ViewerView";
import OverviewView from "./OverviewView";
import DictionaryView from "./DictionaryView";

interface Props {
  datasets: Record<SourceKey, SourceData>;
}

function defaultSelected(dataset: SourceData): string {
  const withPoints = dataset.spectra.find((s) => s.pointCount > 0);
  return (withPoints ?? dataset.spectra[0])?.id ?? "";
}

export default function Dashboard({ datasets }: Props) {
  const [source, setSource] = useState<SourceKey>("nasa");
  const [view, setView] = useState<ViewKey>("viewer");
  const [selected, setSelected] = useState<Record<SourceKey, string>>(() => ({
    nasa: defaultSelected(datasets.nasa),
    mast: defaultSelected(datasets.mast),
  }));

  const dataset = datasets[source];
  const content = CONTENT[source];

  const selectView = useMemo(
    () => (id: string) => setSelected((prev) => ({ ...prev, [source]: id })),
    [source],
  );

  return (
    <main className="page">
      <section className="card raised" style={{ marginTop: 24 }} aria-label="Data source selector">
        <div className="card-header" style={{ alignItems: "center" }}>
          <SourceToggle source={source} onChange={setSource} />
          <p className="type-body muted" style={{ margin: 0, maxWidth: 420 }}>
            Switch the whole view between the two archives. They measure different quantities, so
            the axes and captions change with the source.
          </p>
        </div>
      </section>

      <NavTabs view={view} onChange={setView} />

      <div role="tabpanel">
        {view === "viewer" ? (
          <ViewerView
            dataset={dataset}
            content={content}
            selectedId={selected[source]}
            onSelect={selectView}
          />
        ) : null}
        {view === "overview" ? <OverviewView dataset={dataset} content={content} /> : null}
        {view === "dictionary" ? <DictionaryView dataset={dataset} content={content} /> : null}
      </div>
    </main>
  );
}
