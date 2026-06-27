"""Helper to save figures to the output folder, creating it if needed."""

from importlib import import_module
import os

cfg = import_module(f"{__package__}.01_config")
import matplotlib.pyplot as plt


def ensure_dir():
    """Create the figures output directory if it does not exist."""
    os.makedirs(cfg.FIGURES_DIR, exist_ok=True)


def save(fig, name):
    """Save one figure as a PNG at the configured DPI, close it, return its path."""
    path = os.path.join(cfg.FIGURES_DIR, name)
    fig.savefig(path, dpi=cfg.DPI, bbox_inches="tight")
    plt.close(fig)
    return path
