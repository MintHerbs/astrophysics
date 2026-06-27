"""Paths, figure style, output directory, and colours for the dataset plots."""

import os
import matplotlib

# Headless-safe backend: we only write PNG files, never open windows.
matplotlib.use("Agg")

# Input CSVs (written by app.py / the dataset_builder pipeline).
CATALOGUE_CSV = "dataset_catalogue.csv"
FILES_CSV = "dataset_files.csv"

# Where PNGs are written (created if missing).
FIGURES_DIR = os.path.join("dataset_viz", "figures")

DPI = 150
FIGSIZE = (10, 6)

# Exposures shorter than this (seconds) are flagged on the histogram.
SHORT_EXPOSURE_S = 60

# Colours.
BAR_COLOR = "#4C72B0"
FLAG_COLOR = "#C44E52"
ACCENT_COLOR = "#55A868"
