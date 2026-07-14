# 08. Review, fact-check, and gaps

> The authoritative record of the internal review carried out on 2026-07-05: what was verified against
> primary sources, which defects were found, and how each was corrected. This document is the anchor
> that the corrections in the working docs (01-07) point back to. Background:
> [README.md](README.md); the frozen submission is [../docs.txt](../docs.txt).

## Why this document exists

The submitted proposal ([../docs.txt](../docs.txt)) and its readable mirror ([proposal.md](proposal.md))
are the frozen source of truth and are never edited. Science, however, moves, and a close review found
places where the proposal's wording, its citations, or its implicit assumptions need refining before
the work is published. This document records that review so the corrections are transparent and
traceable, while the original submission stays intact for the record.

Every correction applied to the working docs carries a pointer such as "see
[08-review-and-gaps.md](08-review-and-gaps.md) C1" back to the entry here that justifies it.

Severity keys: **C** critical (address before submission), **S** significant (accuracy or internal
consistency), **M** minor (polish or bibliographic).

## What was verified (and confirmed correct)

Checked against primary sources, not memory:

- **All 19 references are real and correctly cited** (author, year, journal, volume, article number).
  Only cosmetic issues remain (diacritics, one dropped colon, one now-published volume); see M5.
- **The target-gas band positions are physically correct.** CFC-11's strongest band is near 11.8 um
  (the red edge of the target window); CFC-12 has a band near 1161 cm-1, about 8.6 um (the blue edge);
  SF6's nu3 band is about 10.3 to 10.8 um; NF3's nu1 band is at 1032 cm-1, about 9.7 um; ozone's
  strongest mid-infrared band is at 9.6 um. The stated 8.6 to 11.8 um window is a fair envelope.
- **MIRI Low Resolution Spectroscopy covers 5 to 12 um**, with resolving power about 40 to 160, and
  known calibration and sensitivity limits at the red end
  ([JWST LRS documentation](https://jwst-docs.stsci.edu/jwst-mid-infrared-instrument/miri-observing-modes/miri-low-resolution-spectroscopy)).
- **The 10 and 50 ppm noise floors trace directly to Haqq-Misra et al. (2022)**, which found that
  about twice present-Earth CFCs on TRAPPIST-1e would need signal-to-noise of order 5 across nearly
  every available transit under optimistic noise, and that a 50 ppm floor makes even five times
  present-Earth abundances hard to detect
  ([DOI 10.3847/PSJ/ac5404](https://doi.org/10.3847/PSJ/ac5404)).
- **The tools support the plan.** petitRADTRANS accepts custom opacities (ExoCross or ExoMol
  conversion; default grid 80 to 3000 K); PandExo supports MIRI LRS and has been paired with
  petitRADTRANS. NF3 was added to HITRAN2020; CFC-11, CFC-12, and SF6 are provided as experimental
  cross-sections ([petitRADTRANS](https://www.aanda.org/articles/aa/full_html/2019/07/aa35470-19/aa35470-19.html),
  [HITRAN cross-sections](https://hitran.org/xsc/)). This is directionally correct but understates the
  conversion effort for the three cross-section species; see S6.
- **The novelty claim holds.** Detectability theory exists (Lin et al. 2014; Haqq-Misra et al. 2022;
  Schwieterman et al. 2024), but no systematic empirical upper-limit search of the real JWST archive
  has been published. "First empirical upper-limit catalogue" is defensible.

## Critical findings

### C1. The flagship example (TRAPPIST-1) is not in the sample, and the sample is not habitable-zone rocky

The rationale leans on "rocky worlds, such as the TRAPPIST-1 planets, that NASA identifies as
potentially capable of harbouring life". But TRAPPIST-1 has no MIRI Low Resolution Spectroscopy
transmission observations: its MIRI data is broadband photometry in secondary eclipse at 12.8 and
15 um (thermal emission), which a transmission pipeline cannot use
([Nature Astronomy, 2024](https://doi.org/10.1038/s41550-024-02428-z);
[Greene et al. 2023](https://arxiv.org/abs/2303.14849)). In the project's own inventory
([../data/MAST/mast_miri_inventory.csv](../data/MAST/mast_miri_inventory.csv),
[../data/NASA_Archive/nasa_miri_spectra.csv](../data/NASA_Archive/nasa_miri_spectra.csv)) the rocky
targets that do appear (55 Cancri e, GJ 1132 b, LHS 3844 b, LHS 1478 b) are hot, not habitable-zone;
the only temperate targets are sub-Neptunes (K2-18 b, GJ 1214 b), not rocky worlds.

**Fix:** state honestly that the current MIRI transmission archive contains essentially no
habitable-zone rocky planets, that its temperate targets are sub-Neptunes and its rocky targets are
hot, and reframe TRAPPIST-1 as the motivating and future (Ariel) case rather than a present target.
Applied in [01-aims-and-objectives.md](01-aims-and-objectives.md).

### C2. Target-gas cross-sections are terrestrial-temperature only, so invalid for the hot majority

The HITRAN cross-sections for CFC-11, CFC-12, and SF6 are laboratory measurements at roughly 190 to
300 K. They are physically meaningless at the temperatures of 55 Cancri e (about 2000 K) or the hot
Jupiters in the sample (about 1000 to 1500 K). The petitRADTRANS default 80 to 3000 K grid applies to
standard line-list species, not to these heavy-molecule cross-sections. The technosignature retrieval
is therefore only valid on the cool and temperate subset. The docs did not state this.

**Fix:** add a cross-section temperature-validity caveat and restrict the technosignature catalogue to
targets cool enough for the cross-sections to apply. Applied in [02-methodology.md](02-methodology.md)
and [.claude/rules/science.md](../.claude/rules/science.md).

### C3. The Earth-CFC validation is a noiseless-limit fidelity test, not a JWST-noise sensitivity demonstration

Lustig-Yaeger et al. (2023) recover CFC-11 and CFC-12 from Earth's empirical transmission spectrum
only "in the limit of noiseless transmission spectra"
([arXiv:2308.14804](https://arxiv.org/abs/2308.14804)). Under realistic JWST noise, Earth's real CFCs
(hundreds of parts per trillion) are undetectable. The benchmark is therefore a genuine
out-of-distribution test of the forward model and the spectral unmixing on real, overlapping features,
but it does not demonstrate performance at JWST noise levels. The docs called it "the most important
check" in a way that implied real-world sensitivity.

**Fix:** describe validation as three distinct claims: calibration (coverage tests), sensitivity
(synthetic injection-and-recovery at 10 and 50 ppm), and forward-model fidelity on real
out-of-distribution data (the Lustig-Yaeger benchmark, noiseless limit). Applied in
[02-methodology.md](02-methodology.md).

### C4. The most diagnostic bands sit in MIRI LRS's weakest region

SF6 (about 10.5 um), CFC-12 (about 10.85 um), NF3 (about 11.0 um), and CFC-11 (about 11.8 um) all fall
where MIRI LRS throughput and flux calibration degrade, with CFC-11's key band at the very 12 um edge
([JWST LRS documentation](https://jwst-docs.stsci.edu/jwst-mid-infrared-instrument/miri-observing-modes/miri-low-resolution-spectroscopy)).
This directly weakens sensitivity to the primary gases and was not discussed.

**Fix:** add a per-wavelength sensitivity note; expect the tightest limits near 9 to 10 um (NF3 9.7,
ozone 9.6, CFC-11 9.2) and weaker limits at the red end. Applied in
[04-data-sources.md](04-data-sources.md).

## Significant findings

### S1. The DMS citation is imprecise, and the contested paper is in the project's own dataset

The literature review calls "the contested dimethyl sulfide claim on K2-18b (Madhusudhan et al.,
2023)" the claim that reanalyses rejected. But the 2023 paper reported only a tentative hint (about 1
to 2.4 sigma, [ApJL 956, L13](https://doi.org/10.3847/2041-8213/acf577)); the strongly contested
DMS and DMDS claim is Madhusudhan et al. 2025
([ApJL 983, L40](https://doi.org/10.3847/2041-8213/adc1c8)), reported at about 2.9 to 3.2 sigma, which
is row `2025ApJ...983L..40M` in [../data/NASA_Archive/nasa_miri_spectra.csv](../data/NASA_Archive/nasa_miri_spectra.csv).

**Fix:** cite the 2025 paper as the contested claim, keep the 2023 paper as the tentative hint, and
note that the project re-analyses that exact spectrum. Applied in [06-references.md](06-references.md).

### S2. A 3-sigma detection threshold contradicts the caution the proposal preaches

The proposal sets "detection = a feature exceeding three standard deviations". The K2-18b DMS
controversy it cites as its cautionary tale was itself a roughly 2.9 to 3.2 sigma claim. A 3 sigma bar
is the level that produced the controversy.

**Fix:** adopt the field norm: 5 sigma across independent channels for a "detection", 3 sigma as
"tentative", and 95 percent for the reported upper limit. Applied in [02-methodology.md](02-methodology.md)
and [.claude/rules/science.md](../.claude/rules/science.md).

### S3. "No simulation-to-real gap" overstates for nested sampling, and NPE's gap was unstated

Nested sampling has no training gap, but it shares the forward-model gap: the same petitRADTRANS
physics and the same temperature-limited cross-sections. And neural posterior estimation, trained on
synthetic data, fully inherits the simulation-to-real gap that nested sampling avoids.

**Fix:** say "no training gap" for nested sampling and state NPE model misspecification as an explicit
risk, mitigated by the cross-check and by simulation-based-inference coverage diagnostics (for example
coverage tests, simulation-based calibration (Talts et al., 2018), or TARP (Lemos et al., 2023)).
Vasist et al. (2023), already a project reference, validates this same NPE-plus-petitRADTRANS
combination the same way: coverage diagnostics against synthetic ground truth, cross-checked against
classical nested sampling, never against unlabelled real data. Applied in
[02-methodology.md](02-methodology.md).

### S4. The wavelength inclusion criterion, if coded against archive metadata, silently excludes everything

The inclusion rule is "coverage overlaps 8.6 to 11.8 um". But the MAST inventory records
`wavelength_max_um = 10.0` for every MIRI LRS row, because the CAOM `em_max` field understates the
true 5 to 12 um coverage. Filtering `em_max >= 11.8` on that column would reject the whole sample and
lose the CFC-11 band. The reduced spectra in the NASA inventory confirm true coverage to about 11.8 um
and beyond.

**Fix:** key the wavelength criterion off the instrument mode (P750L implies 5 to 12 um), not the CAOM
field, and record the trap. Applied in [04-data-sources.md](04-data-sources.md).

### S5. "Average multiple transits" rarely matches the archive; it is mostly multiple reductions of one transit

In the NASA inventory, WASP-39 b, WASP-43 b, and WASP-107 b appear several times as different pipeline
reductions of the same transit (Eureka!, Tiberius, SPARTA, and so on), not as independent transits.
Averaging reductions is a different and more fraught operation than co-adding genuine repeat transits.

**Fix:** separate the two cases: choose or model across reductions, versus weighted co-adding of
genuine repeat transits. Applied in [02-methodology.md](02-methodology.md) and
[04-data-sources.md](04-data-sources.md).

### S6. petitRADTRANS's custom-opacity routes do not natively ingest HITRAN's cross-section format

Found 2026-07-14, during a data-sourcing and forward-model tooling review (see
[../spec/data-sourcing-spec.md](../spec/data-sourcing-spec.md)). The "tools support the plan" entry
above is correct that petitRADTRANS accepts custom opacities, but is optimistic about how directly:
CFC-11, CFC-12, and SF6 are HITRAN cross-section species (tabulated absorption cross-section against
wavenumber, temperature, and pressure), not line lists, because their spectra are too dense for
line-by-line representation. petitRADTRANS's four documented custom-opacity routes, ExoMol tables
(plug-and-play), DACE cross-section grids, ExoCross-converted line lists, or a hand-written line list
run through `format2petitradtrans()`, are all built around line-list-derived opacities. None is a
direct import path for HITRAN's own cross-section format. NF3, which has a genuine HITRAN2020 line
list, is the one target gas that likely fits the documented ExoCross pathway directly.

petitRADTRANS does support a custom Python load function for arbitrary opacity tables, so the gas is
representable, but loading CFC-11, CFC-12, and SF6 needs a purpose-written
HITRAN-cross-section-to-petitRADTRANS converter. No published precedent exists for this exact
integration: the technosignature detectability literature this project already cites for these gases
(Seager et al., 2023; Schwieterman et al., 2024) used the Planetary Spectrum Generator, not
petitRADTRANS.

**Fix:** track the HITRAN-cross-section converter as its own implementation task rather than an
assumed by-product of "custom opacity species" support. Applied in
[04-data-sources.md](04-data-sources.md).

## Minor findings

- **M1.** The submitted proposal jumps from section 7 to section 12; sections 8 to 11 are absent in
  [../docs.txt](../docs.txt). This is a property of the frozen submission and is noted here only for
  the record; [proposal.md](proposal.md) relabels the reference section.
- **M2.** "HITRAN2020 cross-sections" is imprecise: CFC-11, CFC-12, and SF6 are cross-section species,
  but NF3 is a line-by-line species added in HITRAN2020. Reworded to "cross-sections and line lists".
  Applied in [02-methodology.md](02-methodology.md).
- **M3.** The null-control phrasing "no target signal can physically exist" in the near-infrared is
  slightly too strong (CFCs have weak near-infrared overtone bands); "no strong diagnostic band" is
  safer. Applied in [04-data-sources.md](04-data-sources.md) and [05-glossary.md](05-glossary.md).
- **M4.** The top-level README layout tree omitted the now-populated `data/` directory. Applied in
  [../README.md](../README.md).
- **M5.** Bibliographic polish: restore diacritics (Ardevol Martinez, Marquez-Neila, Molliere), add
  the missing colon to Gal and Ghahramani, and add the now-published Stevenson et al. 2025 locator
  (AJ 170, 257). Applied in [06-references.md](06-references.md).

## Corrections since submission (traceability table)

| Finding | Working-doc edit |
| --- | --- |
| C1 | [01-aims-and-objectives.md](01-aims-and-objectives.md): sample-reality note; TRAPPIST-1 reframed as future case |
| C2 | [02-methodology.md](02-methodology.md): cross-section temperature-validity caveat; technosig limited to cool targets |
| C3 | [02-methodology.md](02-methodology.md): validation split into calibration / sensitivity / fidelity |
| C4 | [04-data-sources.md](04-data-sources.md): red-end sensitivity note |
| S1 | [06-references.md](06-references.md): add Madhusudhan et al. 2025; clarify 2023 vs 2025 |
| S2 | [02-methodology.md](02-methodology.md): 5-sigma detection / 3-sigma tentative / 95 percent limit |
| S3 | [02-methodology.md](02-methodology.md): training-gap wording; NPE risk and mitigations |
| S4 | [03-pipeline-overview.md](03-pipeline-overview.md), [04-data-sources.md](04-data-sources.md): wavelength cut keys off mode |
| S5 | [02-methodology.md](02-methodology.md), [04-data-sources.md](04-data-sources.md): reductions vs transits |
| S6 | [04-data-sources.md](04-data-sources.md): HITRAN-cross-section-to-petitRADTRANS converter needed for CFC-11, CFC-12, SF6 |
| M2 | [02-methodology.md](02-methodology.md): "cross-sections and line lists" |
| M3 | [04-data-sources.md](04-data-sources.md), [05-glossary.md](05-glossary.md): null-control wording |
| M4 | [../README.md](../README.md): add `data/` to layout |
| M5 | [06-references.md](06-references.md): diacritics, colon, Stevenson locator |

## What remains frozen

[../docs.txt](../docs.txt) is never edited: it is the verbatim submitted proposal. [proposal.md](proposal.md)
is its faithful readable mirror and is not changed in substance; it carries only a one-line pointer to
this document for corrections since submission. This split is enforced by the frozen source-of-truth
rule in [../.claude/rules/documentation.md](../.claude/rules/documentation.md), a PreToolUse hook that
blocks edits to `docs.txt`, and a `pre-commit` hook that blocks committing changes to it.

## Sources

- Haqq-Misra et al. 2022, PSJ 3, 60. <https://doi.org/10.3847/PSJ/ac5404>
- Lustig-Yaeger et al. 2023, PSJ 4, 170. <https://arxiv.org/abs/2308.14804>
- Stevenson et al. 2025, AJ 170, 257. <https://doi.org/10.3847/1538-3881/ae0338>
- Madhusudhan et al. 2023, ApJL 956, L13. <https://doi.org/10.3847/2041-8213/acf577>
- Madhusudhan et al. 2025, ApJL 983, L40. <https://doi.org/10.3847/2041-8213/adc1c8>
- Schwieterman et al. 2024, ApJ 969, 20. <https://doi.org/10.3847/1538-4357/ad4ce8>
- Seager et al. 2023, Scientific Reports 13, 13576. <https://doi.org/10.1038/s41598-023-39972-z>
- TRAPPIST-1 b MIRI eclipse photometry: Nature Astronomy 2024. <https://doi.org/10.1038/s41550-024-02428-z>
- MIRI LRS documentation. <https://jwst-docs.stsci.edu/jwst-mid-infrared-instrument/miri-observing-modes/miri-low-resolution-spectroscopy>
- HITRAN2020, Gordon et al. 2022, JQSRT 277, 107949; cross-section search. <https://hitran.org/xsc/>
- HITRAN cross-section definitions. <https://hitran.org/docs/cross-sections-definitions/>
- petitRADTRANS, Mollière et al. 2019, A&A 627, A67. <https://www.aanda.org/articles/aa/full_html/2019/07/aa35470-19/aa35470-19.html>
- petitRADTRANS: adding opacities documentation. <https://petitradtrans.readthedocs.io/en/latest/content/adding_opacities.html>
- Vasist et al. 2023, A&A 672, A147. <https://doi.org/10.1051/0004-6361/202245263>
- Talts et al. 2018, Validating Bayesian inference algorithms with simulation-based calibration. <https://arxiv.org/abs/1804.06788>
- Lemos et al. 2023, Sampling-based accuracy testing of posterior estimators for general inference (TARP), PMLR 202, 19256-19273. <https://arxiv.org/abs/2302.03026>
- Welbanks et al. 2024, Nature 630, 836. <https://arxiv.org/abs/2405.11018>
- JWST Program Information (STScI), proposals 2722 and 3557 (APT exports). <https://www.stsci.edu/jwst-program-info/>
