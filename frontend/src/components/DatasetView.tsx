"use client";

import { useState } from "react";
import type { SourceData } from "@/lib/types";
import type { SourceContent } from "@/lib/content";
import RawDataGrid from "./RawDataGrid";
import CleanRawTable from "./CleanRawTable";
import EmptyState from "./EmptyState";
import Icon from "./Icon";

interface Props {
  dataset: SourceData;
  content: SourceContent;
}

type DisplayMode = "clean" | "grid";

export default function DatasetView({ dataset, content }: Props) {
  const [mode, setMode] = useState<DisplayMode>("clean");

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

  const source = content.key as "nasa" | "mast";

  return (
    <div className="stack">
      <div className="card">
        <div className="card-header" style={{ alignItems: "center" }}>
          <p className="type-body muted" style={{ margin: 0 }}>
            {mode === "clean"
              ? "A clean read of the full raw dataset. Click a column header to sort. The columns specific to the transmission spectroscopy study are highlighted in purple."
              : "Interact with the full raw dataset. You can sort and filter by column, toggle column visibility, and click rows to select them. The columns specific to the transmission spectroscopy study are highlighted in purple."}
          </p>
          <div className="segmented" role="group" aria-label="Table display mode">
            <button
              type="button"
              className="segmented-btn"
              aria-pressed={mode === "clean"}
              onClick={() => setMode("clean")}
            >
              <Icon name="table_rows" />
              Clean
            </button>
            <button
              type="button"
              className="segmented-btn"
              aria-pressed={mode === "grid"}
              onClick={() => setMode("grid")}
            >
              <Icon name="grid_on" />
              Spreadsheet
            </button>
          </div>
        </div>
        <hr className="divider" style={{ margin: "14px 0" }} />
        {mode === "clean" ? <CleanRawTable source={source} /> : <RawDataGrid source={source} />}
      </div>
    </div>
  );
}
