# data/MAST/plots

Figures generated from the MAST MIRI spectra in [../raw](../raw), for example
the median extracted flux versus wavelength. Generate them with:

```
python data/MAST/plot_mast_spectrum.py
```

Figures are treated as regenerable and are not committed by default (the
repository ignores generated figures). Only this README is tracked. To keep one
curated figure under version control, force-add it explicitly:

```
git add -f data/MAST/plots/<name>.png
```
