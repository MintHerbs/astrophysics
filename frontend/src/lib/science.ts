/**
 * Science band annotations for the spectrum chart.
 *
 * Every value here is taken verbatim from the project documentation; nothing is
 * estimated. If a value is not stated in the docs it is not included.
 *
 *  - Technosignature target window, 8.6 to 11.8 micrometres:
 *    docs.txt and docs/proposal.md ("between roughly 8.6 and 11.8 micrometres"),
 *    docs/04-data-sources.md ("roughly 8.6 to 11.8 micrometres for the
 *    technosignature gases").
 *  - Ozone feature, near 9.6 micrometres:
 *    docs.txt and docs/02-methodology.md ("principally ozone near 9.6
 *    micrometres"), docs/05-glossary.md, docs/04-data-sources.md.
 */

export interface WindowBand {
  kind: "window";
  id: string;
  label: string;
  min_um: number;
  max_um: number;
  description: string;
  source: string;
}

export interface LineBand {
  kind: "line";
  id: string;
  label: string;
  center_um: number;
  description: string;
  source: string;
}

export type ScienceBand = WindowBand | LineBand;

export const SCIENCE_BANDS: ScienceBand[] = [
  {
    kind: "window",
    id: "technosignature-window",
    label: "Technosignature target window",
    min_um: 8.6,
    max_um: 11.8,
    description:
      "Mid-infrared window where the four industrial technosignature gases " +
      "(CFC-11, CFC-12, SF6, NF3) imprint their absorption features.",
    source: "docs.txt; docs/proposal.md; docs/04-data-sources.md",
  },
  {
    kind: "line",
    id: "ozone-feature",
    label: "Ozone feature (near 9.6 um)",
    center_um: 9.6,
    description:
      "Ozone biosignature band, assessed with methane as a disequilibrium pair.",
    source: "docs.txt; docs/02-methodology.md; docs/05-glossary.md",
  },
];
