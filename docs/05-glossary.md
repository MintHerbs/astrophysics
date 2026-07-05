# 05. Glossary

Plain-language definitions of the terms used across this project, for a reader with a computer
science background. Chemistry and astronomy terms are explained as they appear.

## Science and mission

- Technosignature: an observable sign of technology, here an industrial pollutant gas with no
  significant natural source.
- Biosignature: an observable sign of life, here a gas produced or sustained by living processes
  (for example ozone, or organic sulphur compounds such as dimethyl sulfide).
- Exoplanet: a planet orbiting a star other than the Sun.
- Transit: the passage of a planet in front of its host star as seen from Earth, during which a small
  fraction of starlight passes through the planet's atmosphere.
- Transmission spectroscopy: measuring how much starlight is absorbed at each wavelength during a
  transit, which reveals which gases are present. The core measurement this project analyses.
- JWST: the James Webb Space Telescope.
- MIRI: JWST's Mid-Infrared Instrument. Covers the mid-infrared band where the target gases absorb.
  The scientifically meaningful sample comes from MIRI.
- Near-infrared instruments: JWST's instruments covering the near-infrared, behind most of the
  archive. The target gases have no strong diagnostic band there, so near-infrared spectra serve as a
  null control.
- Habitable / rocky world: a small, rocky planet where liquid water could plausibly exist, such as
  the TRAPPIST-1 planets. The scientifically interesting targets.
- Confounder: a gas or effect (methane, ammonia, hydrogen sulphide, clouds, temperature structure)
  whose absorption overlaps the target bands and could be mistaken for a target gas.

## Target gases

- CFC-11 (trichlorofluoromethane), CFC-12 (dichlorodifluoromethane): chlorofluorocarbon industrial
  gases.
- SF6 (sulphur hexafluoride), NF3 (nitrogen trifluoride): fully fluorinated non-carbon industrial
  gases, highlighted as ideal technosignatures (Seager et al., 2023).
- Ozone (O3): a biosignature proxy, assessed near 9.6 micrometres, paired with methane as a
  disequilibrium indicator.
- DMS (dimethyl sulfide), DMDS (dimethyl disulfide), methyl chloride: candidate organic biosignature
  gases.
- Disequilibrium pair: two gases that should not coexist without active replenishment (ozone and
  methane), whose coexistence is a stronger sign of life than either alone.

## Methods and statistics

- Forward model: code that, given known gas abundances, computes the spectrum they produce. Used to
  make labelled training data. petitRADTRANS is the forward model here.
- Radiative transfer: the physics of how light is absorbed and scattered as it passes through an
  atmosphere; what a forward model computes.
- Cross-section: how strongly a molecule absorbs light at each wavelength; taken from HITRAN2020.
- Retrieval: the inverse of forward modelling, inferring abundances from an observed spectrum.
- Nested sampling: a rigorous Bayesian sampling method (dynesty, MultiNest, UltraNest) used for the
  classical retrieval baseline.
- Posterior: the probability distribution over a gas's abundance given the data, the full result
  rather than a single number.
- Upper limit / upper credible bound: the value below which the abundance lies at a stated
  probability (for example 95 percent). The project's headline result.
- Amortised inference: training a model once so that, afterwards, it produces a posterior for any new
  spectrum almost instantly, without re-running an expensive fit.
- NPE (neural posterior estimation): the amortised machine-learning method used here, which learns to
  map a spectrum directly to a posterior.
- Monte Carlo dropout: an alternative uncertainty method, not used, because it is least reliable in
  the distribution tail where the upper limit lives.
- Injection-and-recovery: inserting a known signal into test data and checking the pipeline recovers
  it, a core validation step.
- Posterior calibration (coverage): checking that a stated credible interval contains the truth the
  claimed fraction of the time.
- ppm noise floor: the residual systematic noise assumed to remain, in parts per million. Two floors
  are used, an optimistic 10 ppm and a conservative 50 ppm.
- Signal-to-noise ratio (SNR): how large a signal is relative to the noise; an inclusion criterion
  for admitting a spectrum.
- Detection threshold: the bar for claiming a detection rather than an upper limit. Here, five
  standard deviations across multiple independent channels not explained by any confounder; three to
  five is tentative; below that is a null result reported as an upper limit.
- Pipeline reduction: one team's processing of a raw observation into a spectrum. The archive may
  hold several reductions of the same transit; these are not independent transits.
- Cross-section versus line list: two forms of opacity data. Heavy molecules (CFC-11, CFC-12, SF6)
  are tabulated as absorption cross-sections, valid only over their measured temperature range; NF3
  has a line-by-line list. HITRAN2020 provides both forms.
- Simulation-to-real gap: the risk that a model trained on synthetic spectra behaves differently on
  real data. Nested sampling avoids the training gap; NPE does not, so it is cross-checked against the
  classical retrieval.

## Tools and archives

- petitRADTRANS: the radiative-transfer forward model (Mollière et al., 2019).
- HITRAN2020: the molecular spectroscopic database of cross-sections (Gordon et al., 2022).
- PandExo: JWST and HST instrument-noise simulator (Batalha et al., 2017).
- MAST: the Mikulski Archive for Space Telescopes, JWST's data archive.
- NASA Exoplanet Archive: the catalogue of exoplanet and host-star parameters.
- Ariel: a future transmission-spectroscopy mission whose larger archive this pipeline is designed
  to transfer to.
- Astropy: the core Python library for astronomy utilities and units (Astropy Collaboration, 2022).
