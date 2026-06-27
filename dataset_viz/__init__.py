"""Ordered plotting modules for the JWST dataset visualisations.

Mirrors dataset_builder/: numbered files (by flow: config -> load -> coverage ->
health -> summary -> save) loaded via importlib and re-exported under clean
names for visualize.py to use.
"""

from importlib import import_module

config = import_module(f"{__name__}.01_config")
load = import_module(f"{__name__}.02_load")
coverage = import_module(f"{__name__}.03_coverage")
health = import_module(f"{__name__}.04_health")
summary_fig = import_module(f"{__name__}.05_summary_fig")
save = import_module(f"{__name__}.06_save")

__all__ = ["config", "load", "coverage", "health", "summary_fig", "save"]
