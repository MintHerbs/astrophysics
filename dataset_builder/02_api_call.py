"""MAST/astroquery queries: SET A (JWST NIR time-series) and SET B (HLSP)."""

from importlib import import_module
import pandas as pd
from astroquery.mast import Observations

cfg = import_module(f"{__package__}.01_config")


def to_dataframe(table):
    """astropy Table -> pandas DataFrame (empty frame if no rows)."""
    if table is None or len(table) == 0:
        return pd.DataFrame()
    return table.to_pandas()


def query_jwst_nir_timeseries():
    """SET A: JWST near-infrared time-series (transit) spectroscopy."""
    print("\n[SET A] Querying JWST near-infrared time-series spectroscopy ...")
    obs = Observations.query_criteria(
        obs_collection="JWST",
        dataproduct_type=cfg.TIMESERIES_TYPE,
        instrument_name=cfg.NIR_TSO_MODES,
        intentType="science",
    )
    print(f"[SET A] JWST observations returned: {len(obs)}")
    return to_dataframe(obs)


def query_hlsp_for_targets(target_names):
    """SET B: HLSP science-ready spectra for the same targets, matched by EXACT
    name. (MAST allows only one wildcard per filter, so a list of 'NAME*'
    patterns fails; exact-name lists are OR'd. Name variants won't match.)"""
    print("\n[SET B] Querying HLSP science-ready spectra for the same targets ...")
    if target_names is None or len(target_names) == 0:
        print("[SET B] No targets to look up -- skipping HLSP query.")
        return None

    names = sorted({str(t).strip() for t in target_names if str(t).strip()})
    collected = []
    for i in range(0, len(names), 50):
        batch = names[i:i + 50]
        try:
            tbl = Observations.query_criteria(
                obs_collection="HLSP",
                dataproduct_type=cfg.HLSP_PRODUCT_TYPES,
                target_name=batch,
            )
            if tbl is not None and len(tbl):
                collected.append(tbl.to_pandas())
        except Exception as exc:
            print(f"[SET B] HLSP batch {i // 50} failed ({exc!r}) -- continuing.")

    if not collected:
        print("[SET B] No HLSP products found for these targets.")
        return None

    hlsp = pd.concat(collected, ignore_index=True).drop_duplicates(subset="obsid")
    print(f"[SET B] HLSP observations returned: {len(hlsp)}")
    prov = hlsp["provenance_name"].value_counts().to_dict()
    inst = hlsp["instrument_name"].value_counts().to_dict()
    print(f"[SET B] HLSP provenance: {prov}")
    print(f"[SET B] HLSP instruments: {inst}")
    return hlsp
