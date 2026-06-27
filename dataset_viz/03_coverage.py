"""Coverage bar charts: observations, data volume, and targets per instrument."""

from importlib import import_module

cfg = import_module(f"{__package__}.01_config")
import matplotlib.pyplot as plt


def _have(df, cols, plot_name):
    """True if every column exists; otherwise warn which is missing and skip."""
    for c in cols:
        if c not in df.columns:
            print(f"  [skip] {plot_name}: column '{c}' not found in CSV.")
            return False
    return True


def observations_per_instrument(catalogue):
    """Bar chart of observation count per instrument."""
    if not _have(catalogue, ["instrument"], "observations per instrument"):
        return None
    counts = catalogue["instrument"].value_counts()
    fig, ax = plt.subplots(figsize=cfg.FIGSIZE)
    ax.bar(counts.index.astype(str), counts.values, color=cfg.BAR_COLOR)
    ax.set_title("Observations per instrument")
    ax.set_xlabel("instrument")
    ax.set_ylabel("observations")
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    fig.tight_layout()
    return fig


def volume_per_instrument(files):
    """Bar chart of total data volume (GB) per instrument."""
    if not _have(files, ["instrument", "size_bytes"], "GB per instrument"):
        return None
    gb = (files.groupby("instrument")["size_bytes"].sum()
          .sort_values(ascending=False) / 1e9)
    fig, ax = plt.subplots(figsize=cfg.FIGSIZE)
    ax.bar(gb.index.astype(str), gb.values, color=cfg.BAR_COLOR)
    ax.set_title("Data volume per instrument")
    ax.set_xlabel("instrument")
    ax.set_ylabel("volume (GB)")
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    fig.tight_layout()
    return fig


def targets_per_instrument(catalogue):
    """Bar chart of unique target count per instrument."""
    if not _have(catalogue, ["instrument", "target_name"], "targets per instrument"):
        return None
    counts = (catalogue.groupby("instrument")["target_name"].nunique()
              .sort_values(ascending=False))
    fig, ax = plt.subplots(figsize=cfg.FIGSIZE)
    ax.bar(counts.index.astype(str), counts.values, color=cfg.ACCENT_COLOR)
    ax.set_title("Unique targets per instrument")
    ax.set_xlabel("instrument")
    ax.set_ylabel("unique targets")
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    fig.tight_layout()
    return fig
