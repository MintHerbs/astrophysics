"use client";

import type { SourceData } from "@/lib/types";
import type { SourceContent } from "@/lib/content";
import RawDataGrid from "./RawDataGrid";
import EmptyState from "./EmptyState";

interface Props {
  dataset: SourceData;
  content: SourceContent;
}

export default function DatasetView({ dataset, content }: Props) {
  if (!dataset.present || dataset.spectra.length === 0) {
    return (
      <EmptyState
        icon="inventory_2"
        headline={content.emptyState.headline}
        body={content.emptyState.body}
        steps={content.emptyState.steps}
      />
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <p className="type-body muted" style={{ margin: "0 0 16px 0" }}>
          Interact with the full raw dataset. You can sort and filter by column, toggle column visibility, and click rows to select them.
          The columns specific to the transmission spectroscopy study are highlighted in purple.
        </p>
        <RawDataGrid source={content.key as "nasa" | "mast"} />
      </div>
    </div>
  );
}
