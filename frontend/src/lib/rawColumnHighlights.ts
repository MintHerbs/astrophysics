/**
 * Columns from the raw inventory CSVs that feed the transmission-spectroscopy
 * study directly. These are highlighted in purple in the Dataset view.
 *
 * The match is case-sensitive and by exact header name, so each entry must
 * match a real header of the CSV that /api/dataset/raw serves for that source:
 *  - NASA:  data/NASA_Archive/spectra.csv  (upper-case archive-export headers)
 *  - MAST:  data/MAST/mast_miri_inventory.csv  (lower-case headers)
 * If those headers change, update these lists to match, or the highlight is a
 * no-op.
 */

export const NASA_HIGHLIGHTS = [
  "PL_NAME",
  "SPEC_TYPE",
  "INSTRUMENT",
  "MINWAVELNG",
  "MAXWAVELNG",
  "NUM_DATAPOINTS",
  "BIBCODE",
];

export const MAST_HIGHLIGHTS = [
  "target_name",
  "instrument_name",
  "observation_mode",
  "filter_disperser",
  "wavelength_min_um",
  "wavelength_max_um",
];
