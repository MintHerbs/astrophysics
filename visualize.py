#!/usr/bin/env python3
"""Entry point for the dataset health/overview figures.

Reads dataset_catalogue.csv and dataset_files.csv, generates the coverage and
health plots plus a combined summary, and writes them as PNGs into
dataset_viz/figures/.

Run with:  python visualize.py
"""

from dataset_viz import config, load, coverage, health, summary_fig, save


def main():
    save.ensure_dir()
    catalogue = load.load_catalogue()
    files = load.load_files(catalogue)

    # (filename, figure-or-None). Functions return None and print a note when a
    # required column is missing, so a missing column skips just that plot.
    plots = [
        ("observations_per_instrument.png", coverage.observations_per_instrument(catalogue)),
        ("volume_gb_per_instrument.png", coverage.volume_per_instrument(files)),
        ("targets_per_instrument.png", coverage.targets_per_instrument(catalogue)),
        ("exposure_time_histogram.png", health.exposure_histogram(catalogue)),
        ("files_per_target_top30.png", health.files_per_target(files, top=30)),
        ("observations_timeline.png", health.observations_timeline(catalogue)),
        ("summary.png", summary_fig.build_summary(catalogue, files)),
    ]

    written = [save.save(fig, name) for name, fig in plots if fig is not None]

    print(f"\nWrote {len(written)} figure(s) to {config.FIGURES_DIR}/:")
    for p in written:
        print(f"  {p}")


if __name__ == "__main__":
    main()
