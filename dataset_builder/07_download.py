"""Optional FITS download -- DISABLED by default (the dataset is ~1 TB).

To enable: uncomment download_products below, import it in build_dataset.py, and
call it with a download_dir OUTSIDE the repo (or a git-ignored data/ folder).
"""

# from astroquery.mast import Observations
#
# def download_products(files_df, download_dir="data", flat=True):
#     """Download every file in files_df via its MAST data URI (tens to hundreds
#     of GB -- keep download_dir git-ignored, see .gitignore)."""
#     uris = files_df["data_uri"].dropna().unique().tolist()
#     print(f"Downloading {len(uris)} files into {download_dir}/ ...")
#     return Observations.download_products(
#         uris, download_dir=download_dir, flat=flat,
#     )
