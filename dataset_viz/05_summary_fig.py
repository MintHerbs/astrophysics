"""One combined multi-panel summary figure with the key panels together."""

from importlib import import_module
import pandas as pd

cfg = import_module(f"{__package__}.01_config")
import matplotlib.pyplot as plt


def _note(ax, msg):
    """Show a 'skipped' note in a panel whose data is missing."""
    ax.text(0.5, 0.5, msg, ha="center", va="center", fontsize=9,
            color=cfg.FLAG_COLOR, transform=ax.transAxes)
    ax.set_xticks([])
    ax.set_yticks([])


def build_summary(catalogue, files):
    """2x2 panel: observations/instrument, GB/instrument, exposure histogram,
    and the release-date timeline."""
    fig, axes = plt.subplots(2, 2, figsize=(16, 11))
    fig.suptitle("JWST NIR transmission-spectroscopy dataset — summary",
                 fontsize=15)

    # Observations per instrument.
    ax = axes[0, 0]
    if "instrument" in catalogue.columns:
        c = catalogue["instrument"].value_counts()
        ax.bar(c.index.astype(str), c.values, color=cfg.BAR_COLOR)
        ax.set_title("Observations per instrument")
        plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    else:
        _note(ax, "no 'instrument' column")

    # Volume per instrument.
    ax = axes[0, 1]
    if {"instrument", "size_bytes"}.issubset(files.columns):
        gb = (files.groupby("instrument")["size_bytes"].sum()
              .sort_values(ascending=False) / 1e9)
        ax.bar(gb.index.astype(str), gb.values, color=cfg.BAR_COLOR)
        ax.set_title("Data volume per instrument (GB)")
        plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    else:
        _note(ax, "no 'instrument'/'size_bytes' columns")

    # Exposure-time histogram.
    ax = axes[1, 0]
    if "exposure_time_s" in catalogue.columns:
        exp = pd.to_numeric(catalogue["exposure_time_s"], errors="coerce").dropna()
        exp = exp[exp > 0]
        ax.hist(exp, bins=50, color=cfg.BAR_COLOR)
        ax.axvline(cfg.SHORT_EXPOSURE_S, color=cfg.FLAG_COLOR, linestyle="--")
        ax.set_title("Exposure-time distribution (s)")
    else:
        _note(ax, "no 'exposure_time_s' column")

    # Release-date timeline.
    ax = axes[1, 1]
    if "release_date" in catalogue.columns:
        dates = pd.to_datetime(catalogue["release_date"], errors="coerce").dropna()
        monthly = dates.dt.to_period("M").value_counts().sort_index()
        ax.plot(monthly.index.astype(str), monthly.values, marker="o",
                color=cfg.BAR_COLOR)
        ax.set_title("Observations by release month")
        plt.setp(ax.get_xticklabels(), rotation=60, ha="right", fontsize=6)
    else:
        _note(ax, "no 'release_date' column")

    fig.tight_layout(rect=[0, 0, 1, 0.97])
    return fig
