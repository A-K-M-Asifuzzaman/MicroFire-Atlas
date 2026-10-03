# Scientific hardening audit — 4 October 2026

Baseline HEAD: `fae441b1bb97024f4f81f7bfa6ace47d84f347fb`.
Existing uncommitted change: `film/explorer/overlay.js` (crew/sticker animation). Preserved.

## Already present

- Next 16.3.8, React 19; unit, typecheck, lint and production-build scripts.
- Explorer and Mission Analyst, atmosphere profiles, Evidence Ladder with shared physical-regime ontology, Mission Evidence Brief.
- 56 BASS/BASS-II, 20 Saffire, 2 LUCI records; 62 findings and 19 source documents. Family-specific schemas and provenance retained.
- Deterministic experiment relevance, missing-data coverage and independent evidence-confidence checklist.
- 1,000 seeded variations for ranking/tolerance robustness, an interactive weight playground.
- Research Frontier, planned FM² horizon, Safety Matrix and deterministic nextExperiment.
- Evidence graph, source pages and data downloads.
- MicroFire-Eval's 100 questions, synthetic adversarial claim checks, and a saved 100-question live run with explicit failure metrics.
- Classical OpenCV segmentation and synthetic pipeline tests; no human-labelled real-frame validation set.
- Two guided games with real-record debriefs, responsive layouts, motion controls and existing screenshot/film capture tools.

Inspected route inventory, README, scientific libraries, data/curation pipeline, tests/evaluation records, Analyst components, relevant game/vision/Ask/Compare consumers, methodology and capture selectors. This is not a rewrite or a new benchmark.

## Confirmed remaining issues

1. `MissionLab.findingsForScenario` selects a topic-filtered prefix, without a finding-ranking method.
2. PMMA preset says “same oxygen” and “airflow alone” despite B16/B20=16.5% and B19=16.4%. Compare's numeric tolerance also incorrectly places this oxygen difference under held-constant values.
3. Child CV labels and capture selectors still say AI vision.
4. Atmosphere A wording in profiles, gaps, learning narrative and film material can sound like a current universal specification.
5. Ask has no immediately visible, re-verified offline synthesis example.
6. Finding-level retrieval metrics and human-annotation validation infrastructure are absent.
7. Ask's system prompt still says all tests ran aboard the ISS, contradicting Saffire/LUCI support elsewhere in the same pipeline.
8. Research Frontier prints “microgravity” for every closest analogous record, including a possible LUCI record.

## Scope

Preserve the existing architecture. Add deterministic finding relevance, separately reported robustness and limitations, source-bound insight templates, a labelled static verified example, scientific wording corrections, focused regression/evaluation cases and human-annotation infrastructure. Do not add a safety/risk score, new NASA result, copied source quotation, unverified metadata or another LLM retrieval layer. Preserve curated quotations verbatim.
