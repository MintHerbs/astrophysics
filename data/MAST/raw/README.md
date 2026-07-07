# data/MAST/raw

Downloaded MIRI LRS 1-D spectrum products (X1DINTS FITS) for the observations
listed in [../mast_miri_inventory.csv](../mast_miri_inventory.csv).

These are raw archive data and are never committed to version control (see the
repository [.gitignore](../../../.gitignore) and
[.claude/rules/data.md](../../../.claude/rules/data.md)). Only this README is
tracked, so the folder is visible on a fresh clone; everything else placed here
is git-ignored.

How to populate: use the downloader, which pulls the X1DINTS products for named
targets into this folder (large files, so it is per-target and opt-in):

```
python data/MAST/download_mast_products.py --list          # target names
python data/MAST/download_mast_products.py WASP-107 --dry-run   # size first
python data/MAST/download_mast_products.py WASP-107        # download
```

Then plot the median extracted spectrum per observation into
[../plots](../plots):

```
python data/MAST/plot_mast_spectrum.py
```

Alternatively, fetch a single product by hand from its `product_download_url` in
`mast_miri_inventory.csv` (the form
`https://mast.stsci.edu/api/v0.1/Download/file?uri=<product_uri>`). Downloaded
products arrive under a `mastDownload/` subtree here and are git-ignored.
