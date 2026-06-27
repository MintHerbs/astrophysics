"""Constants: instrument modes, query selectors, output paths, batch size."""

# Near-infrared spectroscopic time-series instrument modes (the verified live
# instrument_name values for dataproduct_type="timeseries"). MIRI (mid-IR),
# NIRCAM/IMAGE (photometry) and NIRSpec MSA/IFU (non-transit) are excluded.
NIR_TSO_MODES = ["NIRSPEC/SLIT", "NIRISS/SOSS", "NIRCAM/GRISM"]

# JWST transit/time-series data is labelled "timeseries", NOT "spectrum".
# Filtering on "spectrum" returns NIRSpec/MSA survey spectra and excludes every
# transit, so "timeseries" is the correct time-series-mode selector.
TIMESERIES_TYPE = "timeseries"

# HLSP reduced spectra arrive tagged either way.
HLSP_PRODUCT_TYPES = ["spectrum", "timeseries"]

# Calibrated 1-D spectral product groups kept for the JWST set
# (X1DINTS/X1D = extracted 1-D spectra, WHTLT = white-light curve).
JWST_SPECTRAL_SUBGROUPS = {"X1DINTS", "X1D", "WHTLT"}

CATALOGUE_CSV = "dataset_catalogue.csv"
FILES_CSV = "dataset_files.csv"
PRODUCT_BATCH = 100
