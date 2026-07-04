# Research Proposal (readable version)

This is a formatted, readable copy of the submitted proposal. The verbatim original is kept at
[../docs.txt](../docs.txt) and remains the source of truth. Content here is unchanged in substance;
only the formatting has been cleaned up.

- Institution: University of Mauritius, Faculty of Information, Communication and Digital Technologies
- Prepared by: Munazir Ramjhun, Atish Joottun, and Tanoo Joyekurun

## 1. Tentative title

A Systematic Machine Learning Search for Technosignature and Biosignature Gases in the James Webb
Space Telescope (JWST) Exoplanet Transmission Spectroscopy Archive.

## 2. Statement of the problem

Any civilisation advancing toward technological egress must first pass through the discovery of fire,
a step that leads, in turn, to industrialisation and, by extension, to pollution as that civilisation
grows beyond its home world. It is this trajectory that motivates our study.

We aim to monitor four industrial gases:

1. trichlorofluoromethane (CFC-11);
2. dichlorodifluoromethane (CFC-12);
3. sulphur hexafluoride (SF6); and
4. nitrogen trifluoride (NF3).

These gases have no significant natural source and would, if present in an exoplanet atmosphere,
constitute strong evidence of an industrial civilisation (Lin et al., 2014; Seager et al., 2023).
They imprint distinctive absorption features in the mid-infrared, between roughly 8.6 and 11.8
micrometres.

Although several studies have modelled the theoretical detectability of such gases (Haqq-Misra et
al., 2022; Schwieterman et al., 2024), no systematic and reproducible search of the real, archived
JWST transmission-spectroscopy data has yet been carried out. As a result, there is no empirical,
quantitative ceiling on how abundant these gases could be in real exoplanet atmospheres while still
having escaped detection. The same gap applies to the atmospheric biosignatures that would indicate
life rather than technology, which this project therefore also addresses. The problem is thus
twofold:

1. the absence of an empirical upper-limit catalogue derived from real archival spectra; and
2. the absence of a reusable machine-learning pipeline capable of producing such limits at scale.

## 3. Rationale of the study

An actual detection using the present archive is extremely unlikely. The bulk of the JWST archive is
dominated by hot gas giants and sub-Neptunes, whose atmospheres have no plausible industrial
reservoir, so our study instead concentrates on the much smaller set of rocky worlds, such as the
TRAPPIST-1 planets, that NASA identifies as potentially capable of harbouring life. Even for these
targets, the expected signal is so small that detecting present-day-Earth-level concentrations of
these gases would require observing essentially every available transit, and only under optimistic
noise assumptions (Haqq-Misra et al., 2022).

This does not make the study unnecessary; it makes a different framing necessary. The intended
deliverable is an upper limit: a defensible statement of the form "the abundance of gas X on planet Y
is below a given value at 95 percent credibility". Framed this way, a non-detection is not a failure
but a result in its own right, namely the first systematic, empirical ceiling on industrial pollution
measured across real, potentially habitable exoplanets. Such a result is publishable and citable
regardless of outcome, following the template already established for nitrogen-dioxide pollution
(Kopparapu et al., 2021) and for chlorofluorocarbon detectability (Haqq-Misra et al., 2022). The
study additionally delivers a reusable, open-source inference pipeline that will transfer directly to
the much larger archives expected from future missions.

## 4. Objectives of the study

General objective: to develop and validate a reproducible machine-learning pipeline that searches the
JWST transmission-spectroscopy archive for industrial technosignature gases and selected gaseous
biosignatures, and produces the first empirical, quantitative upper limits on their atmospheric
abundances.

Specific objectives:

- Objective 1: build a large set of labelled synthetic training spectra by forward-modelling
  exoplanet atmospheres with known gas abundances and realistic JWST noise.
- Objective 2: develop and calibrate a noise-aware Bayesian model that turns a noisy spectrum into an
  abundance posterior for each gas, validated against a classical retrieval and a real benchmark
  spectrum.
- Objective 3: apply the validated pipeline to the real JWST archive, focusing on the MIRI subset, to
  derive per-planet upper limits, and release it as open-source.

Secondary objective: extend the pipeline to biosignature gases in the same MIRI window, principally
ozone (assessed with methane as a disequilibrium pair) and the organic candidates DMS, DMDS, and
methyl chloride, reported as cautious upper limits.

## 5. Brief literature review

Industrial pollutants were first proposed as detectable technosignatures by Lin et al. (2014). Later
work refined the target list, with Seager et al. (2023) highlighting NF3 and SF6, and Schwieterman et
al. (2024) a broader set of artificial greenhouse gases. Their key absorption features lie in the
mid-infrared, reachable only by JWST's MIRI instrument, not the near-infrared instruments behind most
of the archive. Crucially, existing assessments rest on simulated data (Kopparapu et al., 2021;
Haqq-Misra et al., 2022) rather than the real archive.

Machine learning is now an established route for atmospheric retrieval, from supervised methods
(Marquez-Neila et al., 2018) to probabilistic ones (Cobb et al., 2019; Ardevol Martinez et al.,
2022), with Vasist et al. (2023) applying neural posterior estimation for better-calibrated
posteriors. Such models train on synthetic spectra from forward models like petitRADTRANS (Molliere
et al., 2019), using HITRAN2020 cross-sections (Gordon et al., 2022) and PandExo noise simulation
(Batalha et al., 2017), and can be validated against a real spectrum of Earth (Lustig-Yaeger et al.,
2023).

The same approach extends to gaseous biosignatures (Schwieterman et al., 2018), most notably ozone
paired with methane as a disequilibrium indicator. The need for a disciplined, upper-limit approach
is clear from the contested dimethyl sulfide claim on K2-18b (Madhusudhan et al., 2023), which later
reanalyses found unsupported (Stevenson et al., 2025). No existing study combines these threads into
a single pipeline applied to the real JWST archive for both industrial and biological gases, which is
the gap this project fills.

## 6. Methodology

Research design. The study is computational, archive-only, and simulation-trained. No new
observations or telescope time are required. The paradigm is supervised Bayesian inference for
spectral unmixing: a model is trained on simulated spectra whose true gas abundances are known, then
applied to real archival spectra to infer each gas's abundance together with its uncertainty.

Data. Two distinct data streams are used. The sample consists of published JWST transmission spectra
drawn from the Mikulski Archive for Space Telescopes (MAST) and the NASA Exoplanet Archive, admitted
under explicit inclusion criteria covering instrument mode, signal-to-noise ratio, and wavelength
coverage. Near-infrared spectra serve as demonstration and null-control data, while the MIRI subset
constitutes the scientifically meaningful sample. The training data are generated synthetically,
because no labelled real dataset exists: nobody has ever measured the true gas abundance of an
exoplanet atmosphere, so labelled spectrum-and-abundance pairs can only be produced by setting an
abundance and forward-modelling the spectrum it produces, as is standard across the field.

Training-data generation. Clean, noiseless spectra are produced with the petitRADTRANS
radiative-transfer model, into which the target gases are added as custom opacity species using
HITRAN2020 cross-sections, alongside spectral confounders (methane, ammonia, hydrogen sulphide,
clouds, and temperature structure) whose absorption overlaps the target bands. Realistic random
instrument noise, scaled to host-star brightness and transit count, is then injected with PandExo,
and a further augmentation stage adds the correlated and systematic noise that PandExo does not fully
capture, using an optimistic (10 ppm) and a conservative (50 ppm) noise floor. The purpose of
injecting noise is not to teach the model to remove it, but to teach the model to recognise how much
noise is present and to widen its uncertainty accordingly.

Inference model. Because an upper limit is a tail quantile of a probability distribution, the model
must be probabilistic; a single-value regressor cannot express the required result. The project
adopts a hybrid design. A classical nested-sampling retrieval (using dynesty, MultiNest, or
UltraNest) provides a rigorous baseline with no simulation-to-real training gap and produces the
trustworthy headline limits, which is feasible because the meaningful sample is small. A fast,
amortised machine-learning model provides the methodological novelty and the scalable, reusable
artefact. Neural posterior estimation is preferred over Monte Carlo dropout, because the latter is
least reliable precisely in the distribution tail where the result lives. A single noise-aware model
maps each noisy spectrum directly to an abundance posterior, rather than using a
denoiser-then-detector chain, which would erase sub-noise signal and discard uncertainty.

Biosignature extension. The same forward-model, noise-injection, and inference chain is applied to a
small set of biosignature gases whose features fall within the MIRI window, principally ozone near
9.6 micrometres, together with dimethyl sulfide, dimethyl disulfide, and methyl chloride. Methane is
already included as a confounder, which allows the ozone and methane disequilibrium pair to be
evaluated at no additional modelling cost. As with the industrial gases, the reported result for each
biosignature is an upper credible bound unless the detection threshold is met.

Validation and analysis. The limits are validated by injection-and-recovery on held-out synthetic
spectra, by posterior calibration (coverage) tests, by agreement between the machine-learning and
classical methods, and, most importantly, by recovery of Earth's known CFC content from a real
out-of-distribution benchmark spectrum (Lustig-Yaeger et al., 2023). Where a planet has multiple
observed transits, these are averaged before inference to improve the signal-to-noise ratio. For each
planet and gas, the upper credible bound of the posterior is reported as the upper limit. A positive
detection is claimed only for a feature exceeding three standard deviations across multiple
independent spectral channels that cannot be explained by any modelled confounder; anything short of
this is reported as a null result with an upper limit. The pipeline is implemented in Python using
PyTorch or JAX, with NumPyro or PyMC for probabilistic modelling and Astropy for astronomy utilities
(Astropy Collaboration, 2022).

## 7. Expected output

The principal output is the first empirical, quantitative upper-limit catalogue on the atmospheric
abundances of CFC-11, CFC-12, SF6, and NF3 across the analysed JWST sample. In addition, the pipeline
yields upper limits on selected biosignature gases, including ozone and the candidate organic
biosignatures dimethyl sulfide, dimethyl disulfide, and methyl chloride, together with an assessment
of the ozone and methane chemical-disequilibrium pair, extending the same disciplined methodology
from technosignatures to signs of life.

The second deliverable is a reusable, open-source machine-learning pipeline for spectral unmixing,
designed to transfer directly to the larger transmission-spectroscopy archives expected from future
missions such as Ariel. The work is intended to result in a peer-reviewed publication whose value
does not depend on a detection, since a rigorously derived non-detection is itself a citable
scientific result. A successful demonstration that the pipeline returns non-informative limits on
near-infrared data, where no target signal can physically exist, will further serve as evidence that
the method behaves correctly.

## References

The full reference list is maintained in [06-references.md](06-references.md).
