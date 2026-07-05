# A Machine Learning Search for Technosignature and Biosignature Gases in the JWST Archive

A reproducible, archive-only research pipeline that searches the James Webb Space Telescope (JWST)
exoplanet transmission-spectroscopy archive for industrial technosignature gases and selected
gaseous biosignatures, and reports the first empirical, quantitative upper limits on their
atmospheric abundances.

Research proposal by Munazir Ramjhun, Atish Joottun, and Tanoo Joyekurun, University of Mauritius,
Faculty of Information, Communication and Digital Technologies.

## Goal

Produce two things:

1. An empirical upper-limit catalogue: for each analysed planet and gas, a defensible statement of
   the form "the abundance of gas X on planet Y is below a given value at 95 percent credibility".
2. A reusable, open-source machine-learning pipeline for spectral unmixing that transfers directly
   to the larger archives expected from future missions such as Ariel.

The framing is deliberate. An actual detection with the present archive is extremely unlikely, so a
non-detection is treated not as a failure but as a result in its own right: the first systematic,
empirical ceiling on industrial pollution and selected biosignatures measured across real,
potentially habitable exoplanets. This follows the template already established for nitrogen-dioxide
pollution (Kopparapu et al., 2021) and chlorofluorocarbon detectability (Haqq-Misra et al., 2022).

## What it does

The study is computational, archive-only, and simulation-trained. No new observations or telescope
time are required. The paradigm is supervised Bayesian inference for spectral unmixing: a model is
trained on simulated spectra whose true gas abundances are known, then applied to real archival
spectra to infer each gas's abundance together with its uncertainty.

Target technosignature gases, all with no significant natural source and distinctive mid-infrared
absorption between roughly 8.6 and 11.8 micrometres:

- trichlorofluoromethane (CFC-11)
- dichlorodifluoromethane (CFC-12)
- sulphur hexafluoride (SF6)
- nitrogen trifluoride (NF3)

Secondary biosignature gases in the same MIRI window: ozone (assessed with methane as a
disequilibrium pair), and the organic candidates dimethyl sulfide (DMS), dimethyl disulfide (DMDS),
and methyl chloride.

The pipeline runs end to end in six stages:

1. Acquire and curate the real archival spectra from MAST and the NASA Exoplanet Archive under
   explicit inclusion criteria. The MIRI subset is the scientific sample; near-infrared spectra
   serve as demonstration and null-control data.
2. Forward-model clean synthetic spectra with petitRADTRANS, adding the target gases as custom
   opacity species from HITRAN2020 cross-sections, alongside spectral confounders.
3. Inject realistic instrument noise with PandExo, then augment with correlated and systematic noise
   under an optimistic (10 ppm) and a conservative (50 ppm) noise floor.
4. Infer an abundance posterior per gas with a hybrid model: a classical nested-sampling retrieval
   baseline plus a fast, amortised neural posterior estimation (NPE) model.
5. Validate by injection-and-recovery, posterior calibration (coverage) tests, cross-method
   agreement, and recovery of Earth's known CFC content from a real benchmark spectrum.
6. Apply the validated pipeline to the real JWST archive and assemble the per-planet upper-limit
   catalogue.

## Current status

Foundations. The repository has been reset to a clean research structure built directly from the
submitted proposal (kept verbatim at [docs.txt](docs.txt)). An earlier dataset-builder that queried
MAST and assembled a JWST near-infrared transmission-spectroscopy catalogue exists in the git
history and will be reintroduced under `src/` as the pipeline is rebuilt in stages.

Immediate next step: re-establish the data-gathering stage (archive query and inclusion criteria)
under `src/`. See the roadmap in [docs/07-roadmap.md](docs/07-roadmap.md).

## Repository layout

```
.
  CLAUDE.md              Always-on project context, terminology, rules, and invariants (auto-loaded)
  README.md              This overview
  docs.txt               The submitted research proposal, kept verbatim (frozen source of truth)
  .gitignore             Python and data-artefact ignore rules
  .gitattributes         Enforces LF line endings on the git hooks
  .claude/               Claude Code configuration
    settings.json        Permissions, commit-attribution, and the frozen-docs hook
    rules/               Path-scoped rules loaded on demand
    skills/              Project skills (doc-align, gap-analysis, research-mode, sci-verify, ref-check, scope-guard)
    hooks/               Hook scripts (protect the frozen submission)
  data/                  Lightweight archive inventories and fetch scripts (no bulk data)
  docs/                  The working documentation (start at docs/README.md)
  .githooks/             Versioned git hooks (commit-msg attribution stripper; pre-commit data and frozen-docs guard)
  src/                   Implementation, added in stages (package: technosig)
```

## Getting started

Prerequisites: Python 3.11 or newer, git.

```bash
# 1. Clone
git clone <your-remote-url> astrophysics
cd astrophysics

# 2. Create and activate a virtual environment
python -m venv .venv
# Windows PowerShell:  .venv\Scripts\Activate.ps1
# Bash:                source .venv/bin/activate

# 3. Enable the versioned commit-msg hook (strips attribution lines)
git config core.hooksPath .githooks

# 4. Read the docs, starting with the index
#    docs/README.md
```

Dependencies (petitRADTRANS, PandExo, a nested sampler, a probabilistic library, Astropy, and so on)
will be pinned in a `requirements.txt` or `pyproject.toml` as the corresponding pipeline stages are
built.

## Data policy

Raw spectra and large downloaded archive products are never committed to this repository. Only
derived, lightweight catalogues and code live here. See [docs/04-data-sources.md](docs/04-data-sources.md)
and the data rule in [.claude/rules/data.md](.claude/rules/data.md).

## Documentation

The full working documentation lives in [docs/](docs/). Start at [docs/README.md](docs/README.md),
which indexes every chunk and says which one to read for a given task. The original proposal is kept
untouched at [docs.txt](docs.txt). The internal review, with the fact-check and the corrections since
submission, is in [docs/08-review-and-gaps.md](docs/08-review-and-gaps.md).

Six project skills under [.claude/skills/](.claude/skills/) (`/doc-align`, `/gap-analysis`,
`/research-mode`, `/sci-verify`, `/ref-check`, `/scope-guard`) and the project invariants in
[CLAUDE.md](CLAUDE.md) keep contributions aligned with the project goal. One note on the sample: the
current MIRI transmission archive holds essentially no habitable-zone rocky planets (TRAPPIST-1 has
only MIRI photometry); its temperate targets are sub-Neptunes and its rocky targets are hot. The
upper-limit result is valid throughout; the detail is in
[docs/08-review-and-gaps.md](docs/08-review-and-gaps.md).

## License and attribution

This is an academic research project. All commits and releases are authored solely by the project
owner. See [docs/06-references.md](docs/06-references.md) for the works this study builds on.
