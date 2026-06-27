"""Filter MAST product lists down to science-ready calibrated spectra."""

from importlib import import_module
import pandas as pd
from astroquery.mast import Observations

cfg = import_module(f"{__package__}.01_config")


def get_science_products(obs_df, set_label):
    """Fetch product lists and keep only SCIENCE products at calib level >= 2,
    dropping raw/intermediate files. JWST is further limited to the 1-D spectral
    subgroups; HLSP products are already reduced spectra so all are kept."""
    if obs_df is None or len(obs_df) == 0:
        return pd.DataFrame()

    print(f"\n[{set_label}] Fetching product lists for {len(obs_df)} observations ...")
    obsids = [str(x) for x in obs_df["obsid"].tolist()]
    product_frames = []
    for i in range(0, len(obsids), cfg.PRODUCT_BATCH):
        batch = obsids[i:i + cfg.PRODUCT_BATCH]
        try:
            prods = Observations.get_product_list(batch)
            if prods is not None and len(prods):
                product_frames.append(prods.to_pandas())
        except Exception as exc:
            print(f"[{set_label}] product batch {i // cfg.PRODUCT_BATCH} failed "
                  f"({exc!r}) -- continuing.")

    if not product_frames:
        print(f"[{set_label}] No products returned.")
        return pd.DataFrame()

    prods = pd.concat(product_frames, ignore_index=True)
    print(f"[{set_label}] Raw products returned: {len(prods)}")

    before = len(prods)
    keep = prods[
        (prods["productType"] == "SCIENCE")
        & (pd.to_numeric(prods["calib_level"], errors="coerce") >= 2)
    ].copy()

    if set_label == "JWST":
        sub = keep["productSubGroupDescription"].astype(str).str.upper()
        seen = sorted(set(sub))
        keep = keep[sub.isin(cfg.JWST_SPECTRAL_SUBGROUPS)].copy()
        print(f"[{set_label}] product subgroups seen: {seen}")
        print(f"[{set_label}] keeping spectral subgroups: "
              f"{sorted(cfg.JWST_SPECTRAL_SUBGROUPS)}")

    print(f"[{set_label}] Science-ready spectra kept: {len(keep)} "
          f"(filtered out {before - len(keep)})")
    return keep
