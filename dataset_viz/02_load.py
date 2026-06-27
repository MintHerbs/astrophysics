"""Load the catalogue and files CSVs into dataframes."""

from importlib import import_module
import pandas as pd

cfg = import_module(f"{__package__}.01_config")


def load_catalogue():
    """Read dataset_catalogue.csv (one row per observation)."""
    return pd.read_csv(cfg.CATALOGUE_CSV)


def load_files(catalogue=None):
    """Read dataset_files.csv and, when possible, attach each file's instrument
    and target_name by joining parent_obsid -> the catalogue's obsid."""
    files = pd.read_csv(cfg.FILES_CSV)
    joinable = (catalogue is not None
                and "parent_obsid" in files.columns
                and {"obsid", "instrument", "target_name"}.issubset(catalogue.columns))
    if joinable:
        files = files.merge(
            catalogue[["obsid", "instrument", "target_name"]],
            left_on="parent_obsid", right_on="obsid", how="left",
        )
    return files
