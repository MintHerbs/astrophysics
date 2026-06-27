"""Console summary: unique targets, observation counts, and GB by instrument."""


def print_summary(catalogue, files):
    """Print per-set counts and data volume, plus the HLSP and scope caveats."""
    print("\n" + "=" * 70)
    print("DATASET SUMMARY  (metadata only -- nothing downloaded)")
    print("=" * 70)

    if catalogue.empty:
        print("No observations catalogued.")
        return

    for set_label in catalogue["set"].unique():
        cat = catalogue[catalogue["set"] == set_label]
        n_planets = cat["target_name"].nunique()
        n_obs = len(cat)
        print(f"\n[{set_label}]")
        print(f"  Unique planets/targets : {n_planets}")
        print(f"  Observations           : {n_obs}")

        f = files[files["set"] == set_label]
        if not f.empty:
            merged = f.merge(
                cat[["obsid", "instrument"]],
                left_on="parent_obsid", right_on="obsid", how="left",
            )
            total_gb = merged["size_bytes"].fillna(0).sum() / 1e9
            print(f"  Science files          : {len(f)}")
            print(f"  Total data volume      : {total_gb:.2f} GB")
            by_inst = (merged.groupby("instrument")["size_bytes"]
                       .sum().fillna(0) / 1e9).sort_values(ascending=False)
            print("  Volume by instrument:")
            for inst, gb in by_inst.items():
                print(f"      {str(inst):<16} {gb:8.2f} GB")
        else:
            print("  Science files          : 0")

        if set_label == "HLSP":
            prov = cat["provenance"].value_counts().to_dict()
            print(f"  Provenance breakdown   : {prov}")
            print("  NOTE: matched HLSP entries for these targets are "
                  "ground-based / multi-mission")
            print("        HOST-STAR libraries (e.g. OWLS = APO/ARCES echelle, "
                  "MUSCLES = UV-optical")
            print("        stellar SEDs) -- NOT JWST planet transmission "
                  "spectra. As of this run,")
            print("        MAST CAOM has no JWST reduced transmission-spectrum "
                  "HLSPs catalogued")
            print("        under these target names. Treat SET B as host-star "
                  "context, not")
            print("        as pipeline-ready planet spectra. See README.md.")

    print("\n" + "-" * 70)
    print("SCOPE NOTES (so nothing is implied silently):")
    print(" * MAST has no field that separates TRANSMISSION (transit) from")
    print("   EMISSION (eclipse) or phase-curve time series -- they share the")
    print("   same instrument modes. SET A is therefore all NIR time-series")
    print("   SPECTROSCOPY; isolating pure transits needs an external transit")
    print("   ephemeris / planet list (out of scope for an archive query).")
    print(" * SET A also includes some non-transiting targets that use the same")
    print("   modes (brown dwarfs, directly-imaged companions) and a few flux/")
    print("   calibration standard stars. Filter with a planet catalogue if you")
    print("   need transiting exoplanets only.")
    print("-" * 70)
    print("\n" + "=" * 70)
