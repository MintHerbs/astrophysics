# data/NASA_Archive/raw

Downloaded published-spectrum data files (`.tbl`, IPAC Table Format) for the
rows listed in [../nasa_miri_spectra.csv](../nasa_miri_spectra.csv).

These are raw archive data and are never committed to version control (see the
repository [.gitignore](../../../.gitignore) and
[.claude/rules/data.md](../../../.claude/rules/data.md)). Only this README is
tracked, so the folder is visible on a fresh clone; everything else placed here
is git-ignored.

## Why these cannot be downloaded by a script

The Atmospheric Spectroscopy table serves each spectrum file only from a
per-session Firefly workspace (a path like `/workspace/TMP_<token>/...`), and
the archive documentation states the generated download commands are not
persistent. There is no fixed public URL for a given `.tbl`, so the fetch is a
short manual step. The stable, reachable reference for each spectrum remains its
`reference_bibcode` / `reference_url` recorded in the inventory CSV.

## How to download the 24 MIRI transmission spectra

1. Open the Atmospheric Spectroscopy table:
   <https://exoplanetarchive.ipac.caltech.edu/cgi-bin/atmospheres/nph-firefly?atmospheres>
2. In the table filters (Panel 1), restrict to the MIRI transmission set to
   match the inventory:
   - Instrument column: filter to contain `MIRI`.
   - Type of Spectrum column: filter to `Transmission`.
   This should leave 24 spectra across 9 planets (GJ 1214 b, K2-18 b, K2-22 b,
   L 168-9 b, LTT 3780 c, WASP-107 b, WASP-17 b, WASP-39 b, WASP-43 b), matching
   [../nasa_miri_spectra.csv](../nasa_miri_spectra.csv).
3. Check the box on every remaining row (or the select-all box), then click
   "Download All Checked Spectra". Keep the default IPAC Table Format (`.tbl`).
4. A new browser tab opens with a `wget` script. Run it from inside this folder
   so the files land here, for example:

   ```
   cd data/NASA_Archive/raw
   wget -i <the-script-or-urls-it-lists>
   ```

   (or save each `.tbl` into this folder by hand).
5. Build the tidy dataset and plots:

   ```
   python data/NASA_Archive/build_nasa_spectra_dataset.py
   ```

   That reads every `.tbl` here, writes
   [../nasa_miri_spectra_points.csv](../nasa_miri_spectra_points.csv) (one row
   per spectral point, with planet name and reference matched by file name), and
   writes one plot per spectrum into [../plots](../plots).

The `spec_path` column in `nasa_miri_spectra.csv` is the archive-internal path;
its final component is the `.tbl` file name, which is how the build script
matches a downloaded file back to its planet and reference.
