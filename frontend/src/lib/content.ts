/**
 * Static, source-specific copy: axis labels, captions, provenance, empty-state
 * instructions, and plain-language descriptions for each real CSV column.
 *
 * This file holds explanatory text only. It never contains spectra, planet
 * names, wavelengths, or measured values: those come solely from the generated
 * JSON. The column names shown in the data dictionary come from the actual CSV
 * headers in the JSON; the descriptions below are matched to them by name.
 */

import type { SourceKey } from "./types";

export interface Step {
  text: string;
  code?: boolean;
}

export interface SourceContent {
  key: SourceKey;
  name: string;
  short: string;
  badge: string;
  icon: string;
  measurement: {
    quantity: string;
    axisLabel: string;
    isTransmission: boolean;
    caption: string;
  };
  caution?: string;
  provenance: {
    archive: string;
    productKind: string;
    url: string;
    query?: { label: string; text: string };
    notes: string[];
  };
  emptyState: {
    headline: string;
    body: string;
    steps: Step[];
  };
  tables: {
    primaryTitle: string;
    secondaryTitle: string;
    primary: Record<string, string>;
    secondary: Record<string, string>;
  };
}

export const CONTENT: Record<SourceKey, SourceContent> = {
  nasa: {
    key: "nasa",
    name: "NASA Exoplanet Archive",
    short: "Reduced transmission spectra",
    badge: "Transmission spectrum",
    icon: "public",
    measurement: {
      quantity: "Transit depth",
      axisLabel: "Transit depth",
      isTransmission: true,
      caption:
        "Published, reduced JWST MIRI transmission spectra: transit depth versus " +
        "wavelength. This is a real transmission spectrum and the actual input to " +
        "the technosignature and biosignature pipeline.",
    },
    provenance: {
      archive: "NASA Exoplanet Archive",
      productKind:
        "Reduced transmission spectra from the Atmospheric Spectroscopy table (one row per published spectrum).",
      url: "https://exoplanetarchive.ipac.caltech.edu/",
      query: {
        label: "TAP query (ADQL)",
        text:
          "select pl_name, instrument, spec_type, facility, minwavelng, maxwavelng, " +
          "mintranmid, maxtranmid, num_datapoints, bibcode, authors, note, spec_path " +
          "from spectra where instrument like '%MIRI%' and spec_type = 'Transmission' " +
          "order by pl_name",
      },
      notes: [
        "The inventory (planets, references, wavelength coverage) is read live from data/NASA_Archive/spectra.csv.",
        "Each row's per-point spectrum is parsed on the fly from its own .tbl file, matched by the inventory's spec_path file name.",
      ],
    },
    emptyState: {
      headline: "No local NASA archive dump found",
      body:
        "The viewer reads data/NASA_Archive/spectra.csv for the catalogue and the .tbl files it " +
        "references (placed directly under data/NASA_Archive) for the per-point spectra. Neither " +
        "was found.",
      steps: [
        {
          text:
            "Query the Atmospheric Spectroscopy table for Instrument contains MIRI and Type of Spectrum = Transmission: https://exoplanetarchive.ipac.caltech.edu/cgi-bin/atmospheres/nph-firefly?atmospheres",
        },
        {
          text: "Save the results as data/NASA_Archive/spectra.csv, and the downloaded .tbl files directly under data/NASA_Archive/.",
        },
      ],
    },
    tables: {
      primaryTitle: "Per-point spectra (parsed live from each .tbl file)",
      secondaryTitle: "Spectrum inventory (spectra.csv)",
      primary: {
        source_file: "The .tbl spectrum file this point was parsed from.",
        pl_name:
          "Planet name, identified from the PL_NAME keyword embedded in the downloaded file " +
          "(falling back to a file name match against the inventory's spec_path when absent).",
        reference_bibcode:
          "ADS bibcode of the publication, matched from the file's own PL_NAME and REFERENCE " +
          "keywords against the inventory.",
        note:
          "Reduction pipeline or figure note from the file's NOTE keyword, used to tell apart " +
          "multiple spectra published in the same paper (for example different pipelines).",
        wavelength_um: "Wavelength of the spectral point, in micrometres.",
        depth: "Transit depth at this wavelength, in the units named by depth_unit.",
        depth_err_low: "Lower uncertainty on the transit depth (as parsed from the file).",
        depth_err_high: "Upper uncertainty on the transit depth (as parsed from the file).",
        depth_column: "Original column name the transit depth was read from in the .tbl file.",
        wavelength_column: "Original column name the wavelength was read from in the .tbl file.",
        depth_unit:
          "Unit the transit depth is recorded in (for example percent), read from the file's own " +
          "column-units row; never assumed.",
        wavelength_unit:
          "Unit the wavelength is recorded in, read from the file's own column-units row.",
      },
      secondary: {
        pl_name: "Planet name.",
        instrument: "Instrument as recorded by the archive, for example MIRI - LRS.",
        spec_type: "Spectrum type; Transmission for every row in this set.",
        facility: "Observing facility (JWST).",
        wavelength_min_um: "Lower bound of wavelength coverage, in micrometres.",
        wavelength_max_um: "Upper bound of wavelength coverage, in micrometres.",
        transit_mid_min_bjd: "Earliest transit-midpoint time, in BJD, where recorded.",
        transit_mid_max_bjd: "Latest transit-midpoint time, in BJD, where recorded.",
        num_datapoints: "Number of spectral data points in the published spectrum.",
        reference_bibcode: "Publication bibcode.",
        reference_url: "Stable ADS abstract URL built from the bibcode.",
        authors: "Author list.",
        note: "Archive note on the spectrum, for example the reduction pipeline.",
        spec_path: "Archive-internal path to the spectrum file; its last part is the .tbl file name.",
      },
    },
  },
  mast: {
    key: "mast",
    name: "MAST",
    short: "Extracted flux demo",
    badge: "Extracted flux, not a transmission spectrum",
    icon: "satellite_alt",
    measurement: {
      quantity: "Median extracted flux",
      axisLabel: "Median extracted flux (X1DINTS FLUX)",
      isTransmission: false,
      caption:
        "Time-median extracted stellar flux (X1DINTS FLUX versus wavelength), pooled over " +
        "integrations. This is a raw demo product used only to sanity-check that the data are " +
        "real and cover the MIRI band.",
    },
    caution:
      "This is NOT a transmission spectrum and not a science result. Deriving transit depth " +
      "versus wavelength needs a light-curve fit in each wavelength channel, which this demo " +
      "does not perform. Do not read these values as an atmospheric measurement.",
    provenance: {
      archive: "Mikulski Archive for Space Telescopes (MAST)",
      productKind:
        "MIRI LRS slitless X1DINTS product: the extracted 1-D flux per integration, pooled to a per-wavelength median.",
      url: "https://archive.stsci.edu/",
      query: {
        label: "Observation selection",
        text:
          "obs_collection = JWST, dataproduct_type = timeseries, " +
          "instrument_name = MIRI/SLITLESS, intentType = science, disperser = P750L",
      },
      notes: [
        "One demo product is downloaded on purpose (per-target and opt-in) because the X1DINTS files are large.",
        "The median is extracted stellar flux, not transit depth; it is a sanity check, not a pipeline input.",
      ],
    },
    emptyState: {
      headline: "No MAST product has been downloaded yet",
      body:
        "MAST products are large, so they are fetched per target on purpose. Download one demo " +
        "product and build its median spectrum, then re-run the data-prep step. Run these from " +
        "the repository root.",
      steps: [
        { text: "python data/MAST/download_mast_products.py --list", code: true },
        { text: "python data/MAST/download_mast_products.py WASP-107", code: true },
        { text: "python data/MAST/plot_mast_spectrum.py", code: true },
        { text: "cd frontend && npm run prepare-data", code: true },
      ],
    },
    tables: {
      primaryTitle: "Median spectra (mast_median_spectra.csv)",
      secondaryTitle: "Observation inventory (mast_miri_inventory.csv)",
      primary: {
        observation: "Product/observation identifier; matches obs_id in the MAST inventory.",
        target: "Target name from the FITS primary header.",
        n_integrations: "Number of integrations pooled before taking the per-wavelength median.",
        wavelength_um: "Wavelength in micrometres.",
        median_flux:
          "Median extracted flux in native X1DINTS FLUX units. This is stellar flux, not a transmission depth.",
      },
      secondary: {
        target_name: "MAST target name.",
        target_classification: "Archive object classification.",
        is_background_or_calibration: "True for a background, blank-field, or calibration exposure.",
        instrument_name: "Instrument and submode string (MIRI/SLITLESS).",
        observation_mode: "Plain-language mode label.",
        filter_disperser: "Disperser or filter element (P750L for LRS spectra).",
        wavelength_min_um: "Lower bound of wavelength coverage, in micrometres.",
        wavelength_max_um: "Upper bound of wavelength coverage, in micrometres.",
        exposure_time_s: "Total exposure time, in seconds.",
        obs_start_utc: "Observation start, in UTC.",
        obs_end_utc: "Observation end, in UTC.",
        calib_level: "MAST calibration level.",
        proposal_id: "Programme identifier.",
        proposal_type: "Programme type, for example GO.",
        proposal_pi: "Principal investigator.",
        obs_title: "Programme title.",
        ra_deg: "Target right ascension, in degrees.",
        dec_deg: "Target declination, in degrees.",
        release_date_utc: "Data release date, in UTC.",
        obs_id: "Stable mission observation identifier.",
        obsid: "Numeric MAST observation id.",
        product_uri: "Canonical MAST product URI for the calibrated 1-D product (X1DINTS).",
        product_download_url: "Full download URL built from the product URI.",
      },
    },
  },
};

export function getContent(source: SourceKey): SourceContent {
  return CONTENT[source];
}
