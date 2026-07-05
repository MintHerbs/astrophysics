"use client";

import { useMemo, useState } from "react";
import type { SourceKey } from "@/lib/types";
import { CONTENT } from "@/lib/content";
import { useDataset } from "@/lib/useDataset";
import Icon from "./Icon";
import SourceToggle from "./SourceToggle";
import NavTabs, { type ViewKey } from "./NavTabs";
import ViewerView from "./ViewerView";
import OverviewView from "./OverviewView";
import DictionaryView from "./DictionaryView";

export default function Dashboard() {
  const [source, setSource] = useState<SourceKey>("nasa");
  const [view, setView] = useState<ViewKey>("viewer");
  const nasa = useDataset("nasa");
  const mast = useDataset("mast");
  const [selected, setSelected] = useState<Record<SourceKey, string>>({ nasa: "", mast: "" });

  const active = source === "nasa" ? nasa : mast;
  const content = CONTENT[source];

  const selectSpectrum = useMemo(
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
        {active.loading && !active.data ? (
          <div className="card" style={{ display: "grid", placeItems: "center", padding: 48 }}>
            <div style={{ textAlign: "center" }}>
              <div className="spinner" />
              <p className="type-label muted" style={{ marginTop: 12 }}>
                Loading {content.name} dataset
              </p>
            </div>
          </div>
        ) : active.error ? (
          <div className="banner caution" role="alert">
            <Icon name="error" />
            <p>
              <strong>Could not load the {content.name} dataset.</strong> {active.error} Reload the
              page, or check that the dev server is running.
            </p>
          </div>
        ) : active.data ? (
          <>
            {view === "viewer" ? (
              <ViewerView
                dataset={active.data}
                content={content}
                selectedId={selected[source]}
                onSelect={selectSpectrum}
                onDataChanged={active.reload}
              />
            ) : null}
            {view === "overview" ? <OverviewView dataset={active.data} content={content} /> : null}
            {view === "dictionary" ? <DictionaryView dataset={active.data} content={content} /> : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
