"""Ordered pipeline modules for the JWST NIR dataset catalogue.

Files are numbered by pipeline flow: config -> query -> filter -> catalogue ->
summary -> write (-> optional download). Digit-prefixed filenames aren't valid
import identifiers, so they are loaded here via importlib and re-exported under
clean names for build_dataset.py to use.
"""

from importlib import import_module

config = import_module(f"{__name__}.01_config")
api_call = import_module(f"{__name__}.02_api_call")
filtering = import_module(f"{__name__}.03_filter")
catalogue = import_module(f"{__name__}.04_catalogue")
summary = import_module(f"{__name__}.05_summary")
write_csv = import_module(f"{__name__}.06_write_csv")
download = import_module(f"{__name__}.07_download")

__all__ = [
    "config", "api_call", "filtering", "catalogue", "summary",
    "write_csv", "download",
]
