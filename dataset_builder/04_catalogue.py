"""Shape the query and product results into the two output dataframes."""

import pandas as pd
from astropy.time import Time

# MAST has no observing-mode field, so map instrument_name to a readable label.
_MODE_MAP = {
    "NIRSPEC/SLIT": "NIRSpec BOTS (Bright Object Time Series)",
    "NIRISS/SOSS": "NIRISS SOSS (Single-Object Slitless Spectroscopy)",
    "NIRCAM/GRISM": "NIRCam Grism Time Series",
}


def mjd_to_isodate(mjd):
    """MAST Modified Julian Date -> 'YYYY-MM-DD' ('' if missing/masked)."""
    try:
        if mjd is None or pd.isna(mjd):
            return ""
        return Time(float(mjd), format="mjd").isot[:10]
    except Exception:
        return ""


def human_mode(instrument_name):
    """Plain-English observing mode for an instrument_name."""
    return _MODE_MAP.get(str(instrument_name), str(instrument_name))


def build_catalogue_rows(obs_df, set_label):
    """One row per observation."""
    if obs_df is None or len(obs_df) == 0:
        return pd.DataFrame()
    return pd.DataFrame({
        "set": set_label,
        "target_name": obs_df.get("target_name"),
        "instrument": obs_df.get("instrument_name"),
        "provenance": obs_df.get("provenance_name"),
        "filters_grating": obs_df.get("filters"),
        "observation_mode": obs_df.get("instrument_name").map(human_mode),
        "exposure_time_s": obs_df.get("t_exptime"),
        "proposal_id": obs_df.get("proposal_id"),
        "proposal_pi": obs_df.get("proposal_pi"),
        "release_date": obs_df.get("t_obs_release").map(mjd_to_isodate),
        "obs_id": obs_df.get("obs_id"),        # stable mission identifier
        "obsid": obs_df.get("obsid"),          # numeric id, joins to files table
        "calib_level": obs_df.get("calib_level"),
        "wavelength_region": obs_df.get("wavelength_region"),
    })


def build_file_rows(prod_df, set_label):
    """One row per downloadable file."""
    if prod_df is None or len(prod_df) == 0:
        return pd.DataFrame()
    # 'parent_obsid' links a file back to its observation (older astroquery
    # used 'obsID').
    parent = prod_df["parent_obsid"] if "parent_obsid" in prod_df.columns \
        else prod_df.get("obsID")
    return pd.DataFrame({
        "set": set_label,
        "file_name": prod_df.get("productFilename"),
        "product_type": prod_df.get("productType"),
        "product_subgroup": prod_df.get("productSubGroupDescription"),
        "calib_level": prod_df.get("calib_level"),
        "size_bytes": pd.to_numeric(prod_df.get("size"), errors="coerce"),
        "data_uri": prod_df.get("dataURI"),
        "parent_obsid": parent,
    })
