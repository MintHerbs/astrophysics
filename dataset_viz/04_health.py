"""Health charts: exposure-time histogram, files per target, release timeline."""

from importlib import import_module
import pandas as pd

cfg = import_module(f"{__package__}.01_config")
import matplotlib.pyplot as plt


def exposure_histogram(catalogue):
    """Histogram of exposure times (column 'exposure_time_s'), flagging the
    very short exposures below cfg.SHORT_EXPOSURE_S."""
    if "exposure_time_s" not in catalogue.columns:
        print("  [skip] exposure histogram: column 'exposure_time_s' not found.")
        return None
    exp = pd.to_numeric(catalogue["exposure_time_s"], errors="coerce").dropna()
    exp = exp[exp > 0]
    if exp.empty:
        print("  [skip] exposure histogram: no positive exposure values.")
        return None
    n_short = int((exp < cfg.SHORT_EXPOSURE_S).sum())
    fig, ax = plt.subplots(figsize=cfg.FIGSIZE)
    ax.hist(exp, bins=50, color=cfg.BAR_COLOR)
    ax.axvline(cfg.SHORT_EXPOSURE_S, color=cfg.FLAG_COLOR, linestyle="--",
               label=f"very short < {cfg.SHORT_EXPOSURE_S}s (n={n_short})")
    ax.set_title("Exposure-time distribution")
    ax.set_xlabel("exposure time (s)")
    ax.set_ylabel("observations")
    ax.legend()
    fig.tight_layout()
    return fig


def files_per_target(files, top=30):
    """Horizontal bar chart of file counts for the top-N targets."""
    if "target_name" not in files.columns:
        print("  [skip] files per target: column 'target_name' not found "
              "(the files<->catalogue join did not run).")
        return None
    counts = files["target_name"].value_counts().head(top)
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.barh(counts.index.astype(str)[::-1], counts.values[::-1],
            color=cfg.ACCENT_COLOR)
    ax.set_title(f"Files per target (top {top})")
    ax.set_xlabel("files")
    fig.tight_layout()
    return fig


def observations_timeline(catalogue):
    """Line chart of observations per release-date month."""
    if "release_date" not in catalogue.columns:
        print("  [skip] timeline: column 'release_date' not found.")
        return None
    dates = pd.to_datetime(catalogue["release_date"], errors="coerce").dropna()
    if dates.empty:
        print("  [skip] timeline: no parseable release_date values.")
        return None
    monthly = dates.dt.to_period("M").value_counts().sort_index()
    fig, ax = plt.subplots(figsize=cfg.FIGSIZE)
    ax.plot(monthly.index.astype(str), monthly.values, marker="o",
            color=cfg.BAR_COLOR)
    ax.set_title("Observations by release date (monthly)")
    ax.set_xlabel("release month")
    ax.set_ylabel("observations")
    plt.setp(ax.get_xticklabels(), rotation=60, ha="right", fontsize=7)
    fig.tight_layout()
    return fig
