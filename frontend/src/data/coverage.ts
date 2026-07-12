/**
 * Data for the Coverage map view: telescope wavelength coverage against the
 * absorption bands of the target gases, on one shared wavelength axis.
 *
 * IMPORTANT: the gas band positions below are APPROXIMATE seed values, intended
 * only to orient this reference view. They are NOT retrieval inputs and must be
 * verified against HITRAN2020 (and the relevant cross-section or line-list
 * source for each species) before any use in the paper. Do not treat a value
 * here as authoritative, and do not add gases or bands beyond the fixed target
 * scope in the project CLAUDE.md.
 *
 * The 8.6 to 11.8 micrometre technosignature target window is not duplicated
 * here: it is imported from the single documented source in src/lib/science.ts,
 * which carries its provenance, so this module cannot drift from it.
 *
 * Units: all wavelengths are in micrometres (um).
 */

import { SCIENCE_BANDS, type WindowBand } from "@/lib/science";

/* --------------------------- Spectral regions --------------------------- */

export type SpectralRegionId = "uv" | "visible" | "near-ir" | "mid-ir";

export interface SpectralRegion {
  id: SpectralRegionId;
  label: string;
  min_um: number;
  max_um: number;
}

/**
 * Conventional wavelength region boundaries, for faint background shading only.
 * These are the standard display edges of the electromagnetic bands across the
 * 0.1 to 30 um axis, not physical constants; they are approximate and rounded.
 */
export const SPECTRAL_REGIONS: SpectralRegion[] = [
  { id: "uv", label: "UV", min_um: 0.1, max_um: 0.4 },
  { id: "visible", label: "Visible", min_um: 0.4, max_um: 0.7 },
  { id: "near-ir", label: "Near-IR", min_um: 0.7, max_um: 5 },
  { id: "mid-ir", label: "Mid-IR", min_um: 5, max_um: 30 },
];

/* ------------------------------ Telescopes ------------------------------ */

export type TelescopeKind = "spectroscopy" | "photometry";

/** A darker sub-range drawn inside a telescope bar (for example the MIRI transit window). */
export interface TelescopeSubBand {
  label: string;
  min_um: number;
  max_um: number;
}

export interface Telescope {
  id: string;
  name: string;
  /** Approximate spectral coverage of the instrument or instrument set, in micrometres. */
  min_um: number;
  max_um: number;
  kind: TelescopeKind;
  /** Short descriptor shown beside the name. */
  note: string;
  subBands?: TelescopeSubBand[];
}

/**
 * Approximate wavelength coverage per facility. Ranges are the broad instrument
 * envelopes used to answer "which telescope can see which band" at a glance;
 * they are not exact per-mode limits. Verify before quoting in the paper.
 */
export const TELESCOPES: Telescope[] = [
  {
    id: "hubble",
    name: "Hubble",
    min_um: 0.2,
    max_um: 1.7,
    kind: "spectroscopy",
    note: "UV to near-IR",
  },
  {
    id: "jwst-nir",
    name: "JWST near-IR",
    min_um: 0.6,
    max_um: 5.3,
    kind: "spectroscopy",
    note: "NIRISS, NIRSpec, NIRCam",
  },
  {
    id: "jwst-miri",
    name: "JWST MIRI",
    min_um: 5,
    max_um: 28,
    kind: "spectroscopy",
    note: "mid-IR",
    subBands: [{ label: "transit window", min_um: 5, max_um: 12 }],
  },
  {
    id: "tess-kepler",
    name: "TESS / Kepler",
    min_um: 0.4,
    max_um: 1.0,
    kind: "photometry",
    note: "photometry, not spectra",
  },
];

/* --------------------------------- Gases -------------------------------- */

export type GasGroupId = "industrial" | "biosignature";

export interface GasGroup {
  id: GasGroupId;
  label: string;
  description: string;
}

export const GAS_GROUPS: GasGroup[] = [
  {
    id: "industrial",
    label: "Industrial gases",
    description: "Technosignature target gases with no significant natural source.",
  },
  {
    id: "biosignature",
    label: "Biosignatures",
    description: "Biosignature gases and the methane disequilibrium pair.",
  },
];

export interface Gas {
  id: string;
  name: string;
  group: GasGroupId;
  /** Approximate band centres in micrometres. Seed values; verify against HITRAN2020. */
  bands_um: number[];
  /** Optional clarifying note shown in the readout and tooltip. */
  note?: string;
}

/**
 * Approximate absorption band centres per gas (micrometres). SEED VALUES only:
 * every number here must be verified against HITRAN2020 before use in the paper.
 * The gas set is fixed by the project scope and is not extended here.
 */
export const GASES: Gas[] = [
  // Industrial technosignature gases.
  { id: "cfc-11", name: "CFC-11", group: "industrial", bands_um: [9.2, 11.8] },
  { id: "cfc-12", name: "CFC-12", group: "industrial", bands_um: [8.6, 9.1, 10.9] },
  { id: "sf6", name: "SF6", group: "industrial", bands_um: [10.5] },
  { id: "nf3", name: "NF3", group: "industrial", bands_um: [11.0] },
  // Biosignatures (with methane as the ozone disequilibrium pair).
  { id: "ozone", name: "Ozone", group: "biosignature", bands_um: [0.25, 0.6, 9.6] },
  {
    id: "methane",
    name: "Methane",
    group: "biosignature",
    bands_um: [2.3, 3.3, 7.7],
    note: "Disequilibrium pair for ozone; also a modelled confounder.",
  },
  { id: "dms", name: "DMS", group: "biosignature", bands_um: [3.4] },
  { id: "dmds", name: "DMDS", group: "biosignature", bands_um: [3.4] },
  { id: "methyl-chloride", name: "Methyl chloride", group: "biosignature", bands_um: [3.4, 7.0, 13.7] },
];

/* ----------------------------- Target window ---------------------------- */

/**
 * The 8.6 to 11.8 um technosignature target window, sourced from the single
 * documented definition in src/lib/science.ts so the number is not duplicated.
 */
const technoWindow = SCIENCE_BANDS.find(
  (band): band is WindowBand => band.kind === "window" && band.id === "technosignature-window",
);

if (!technoWindow) {
  // A hard failure here means the documented science band was renamed or removed;
  // fix the source in src/lib/science.ts rather than hardcoding a value here.
  throw new Error("Coverage map: technosignature-window band missing from SCIENCE_BANDS.");
}

export const TARGET_WINDOW = {
  label: "Target window",
  min_um: technoWindow.min_um,
  max_um: technoWindow.max_um,
  source: technoWindow.source,
} as const;

/* ------------------------------ Axis domain ----------------------------- */

/** Shared logarithmic wavelength axis, in micrometres. */
export const AXIS = {
  min_um: 0.1,
  max_um: 30,
  ticks_um: [0.1, 0.3, 1, 3, 10, 30],
} as const;

/* ---------------------------- Coverage logic ---------------------------- */

/** True when a wavelength (um) falls within a telescope's coverage range. */
function coversWavelength(telescope: Telescope, um: number): boolean {
  return um >= telescope.min_um && um <= telescope.max_um;
}

/**
 * Telescopes that can spectroscopically observe at least one of a gas's bands.
 * Photometry facilities are excluded on purpose: they measure broadband flux
 * and cannot resolve an individual absorption band, so listing them as able to
 * "see" a gas would overstate what they do.
 */
export function telescopesCoveringGas(gas: Gas, telescopes: Telescope[] = TELESCOPES): Telescope[] {
  return telescopes.filter(
    (telescope) =>
      telescope.kind === "spectroscopy" && gas.bands_um.some((um) => coversWavelength(telescope, um)),
  );
}

/**
 * Gases with at least one band inside a telescope's range. A photometry facility
 * returns none, for the reason above.
 */
export function gasesReachableByTelescope(telescope: Telescope, gases: Gas[] = GASES): Gas[] {
  if (telescope.kind === "photometry") return [];
  return gases.filter((gas) => gas.bands_um.some((um) => coversWavelength(telescope, um)));
}
