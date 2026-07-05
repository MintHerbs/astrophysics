# data/NASA_Archive/plots

Figures generated from the NASA Exoplanet Archive MIRI spectra in
[../raw](../raw), one per spectrum, showing transit depth versus wavelength
across the MIRI band. Generate them with:

```
python data/NASA_Archive/build_nasa_spectra_dataset.py
```

Figures are treated as regenerable and are not committed by default (the
repository ignores generated figures). Only this README is tracked. To keep one
curated figure under version control, force-add it explicitly:

```
git add -f data/NASA_Archive/plots/<name>.png
```
