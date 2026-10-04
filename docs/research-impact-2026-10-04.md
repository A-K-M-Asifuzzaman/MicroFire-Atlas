# Research intelligence implementation report — 4 October 2026

## A. Baseline audit

Research-pass baseline: `85815a6` (README / Challenge Mode screenshots). The working tree was clean when this pass began. Earlier scientific hardening had been committed by the concurrent workflow, followed by Challenge Mode, finding ranking v1.1, a 42-case finding gold set, the human annotation tool and Safety Matrix improvements. Those changes were inspected and preserved.

- **Already implemented:** 78 structured records across BASS/Saffire/LUCI; 62 findings; 19 sources; shared ontology/Evidence Ladder; separate experiment/finding relevance, coverage and confidence; 1,000-variation experiment sensitivity; finding sensitivity; Ask and its checked offline example; source provenance; 100-question MicroFire-Eval and its finding extensions; Mission Analyst; Explorer; Challenge Mode; Frontier, FM² horizon and Safety Matrix; deterministic nextExperiment; Mission Evidence Brief; evidence graph and downloads.
- **Partially implemented:** Frontier explained individual questions; nextExperiment was prose; the graph connected evidence with individual scenarios/gaps. None computed coverage across a finite research-question registry.
- **Missing:** shared registry, cross-question gap identity, hypothetical candidate specifications, research board, evidence-gain calculation, research exports and a pilot impact-study kit.
- **Should not be built:** a NASA priority/safety score, invented observations, an LLM planning feature, automatic trusted ingestion, database/authentication, a combinatorial scenario generator or another disconnected graph.

Read current HEAD/log/status, README, Challenge module/page/tests, Mission presets, ontology, Frontier, finding relevance, graph and consumers, data/source manifest, downloads, methodology, Brief, existing evaluation and capture tooling. Concurrent edits later appeared in `components/three/FlameScene.ts` and `public/models/`; these are outside this pass and remain untouched.

## B. Implemented system-impact features

1. Shared Mission Analyst preset module and an 11-question curated registry, including the existing Frontier questions. Challenge questions reuse preset identities.
2. A deterministic global Gap Registry retaining exact conditions, question links, named missing dimensions, direct/analogous/mechanistic counts, closest records/findings, planned overlap and original nextExperiment text.
3. Hypothetical structured candidates derived only from real gap requirements, without inferred defaults or outcome fields.
4. `/gaps` Research Priority Board: six transparent sorts, category/family filters, selected-gap evidence trail, recurring dimension counts and source-backed FM² overlap.
5. Evidence Gain Planner: current versus potential condition coverage, affected questions/categories, partial overlap, remaining gaps, unknown dimensions and limitations.
6. Challenge stage-8 links preserve the current scenario. A small homepage teaser opens the research landscape.
7. Extensions of the existing evidence graph: typed MissionScenario, EvidenceGap, CandidateExperiment and PlannedExperiment nodes connected to existing records/findings/sources.
8. Five versioned JSON downloads, with content hashes and explicit derived/hypothetical/planned status.
9. Reproducible methodology, README addition, regression tests and a six-task human pilot kit with an empty participant CSV.

## C. Exact methodology

Only material, gravity, oxygen percentage, pressure in kPa and airflow in cm/s are represented. Unknown values stay absent. Unsupported fields, invalid types, nonfinite/negative numbers, oxygen above 100% and nonpositive pressure are rejected.

Canonical conditions use a fixed key order. Their full encoded JSON identifies the gap/candidate, without hash collision or runtime timestamp. Exact identity never uses tolerance: 34% and 34.1% are different specifications. Duplicate normalized question wording at identical conditions counts once; distinct questions at identical conditions share a gap. Conflicting reused question IDs fail.

For each registered question, run the existing Evidence Ladder against completed BASS, Saffire and LUCI rows. Directly covered questions are excluded from the Gap Registry. Preserve the Ladder's missing dimensions and nextExperiment text. Findings and FM² planning statements never become measured rows.

Analogous support counts rows matching the requested material with at most two differing dimensions. Closest links show five ranked rows; family breadth uses those links and five non-context findings, excluding FM² plan-source findings. Mechanistic counts remain separate. Counts describe the curated corpus, not replication strength.

Generate one candidate per unique unresolved condition specification. Preserve unknown geometry, flow direction, thickness, width, scale, duration, ignition, confinement, orientation, hardware and history. Each candidate points to its source gap and has `hypothetical-research-question` status.

For each candidate–gap pair, call the shared condition comparator: exact material/gravity; oxygen ±1.5 percentage points; pressure ±10 kPa; flow ±max(1 cm/s, 50% of the gap's requested flow). Missing requested values fail. All dimensions matching yields potential direct-condition coverage. Material/gravity mismatch blocks partial overlap. Otherwise a matched missing dimension, or two matched dimensions for a combination gap, is reported as partial overlap only. Partial matches never count toward new direct coverage.

Newly covered questions are the union of scenario IDs across directly addressed gaps. Add their count to current direct-condition coverage. Candidates are ordered by gap coverage, then affected questions, then stable ID. The board separately sorts by shared questions, direct count ascending (analogous count ascending for ties), category breadth, analogous support, planned overlap or candidate gap coverage; stable gap IDs break remaining ties.

FM² overlap requires verified contextual plan findings; only lunar gravity and explicitly planned PMMA/SIBAL material are mapped. Full atmosphere/geometry/flow compatibility is not inferred. It never increases observed coverage.

Versioned exports identify the algorithm, scenario registry and normalized planner corpus. Manifest identity is SHA-256 of compact JSON.stringify with sources sorted by source_id; corpus records/findings are sorted by ID. This is documented in each envelope. It is not the checksum of the whitespace-formatted download bytes.

## D. Current landscape

| Dimension | Actual result |
|---|---:|
| Curated questions | 11 |
| Current direct-condition matches | 5 |
| Questions without a direct match | 6 |
| Unique condition gaps | 6 |
| Exact gaps shared by distinct questions | 0 |
| Hypothetical candidates | 6 |
| Highest candidate gap coverage | 2 |
| Affected questions | 2 |
| Affected categories | 1 |
| Potential direct-condition coverage | 7 / 11 |
| Gaps remaining after that candidate | 4 |

The highest-coverage candidate under this finite heuristic is **SIBAL fabric, Martian gravity, 34% oxygen, 56.5 kPa, 10 cm/s airflow**. It could cover the existing Mars Mission preset and the broader Frontier question that leaves airflow unspecified. This is breadth across two differently specified questions in one category, not evidence of broad researcher demand. No artificial duplicate scenarios were added to create a shared-gap headline.

## E. Scientific safeguards

- NASA evidence arrays and direct quotations are unchanged.
- Candidates contain no NASA citation, observed outcome or record-family identity; graph discriminants require hypothetical status.
- FM² stays a planned node/overlap and cannot enter completed record counts or candidate evidence.
- Coverage comparison is shared with the Evidence Ladder; exact gap identity is separate from matching tolerance.
- Missing pressure/material/flow stays unknown. Additional unsupported dimensions fail explicitly.
- LUCI retains the simulated-gravity limitation; matched conditions do not establish Moon-surface evidence.
- Partial overlap and remaining gaps stay visible. A valid record could produce any experimental outcome.
- No estimate of safety, risk reduction, entropy, feasibility, cost, TRL, success probability, funding or NASA priority.
- No new LLM request, dependency, database, identity collection or automatic ingestion.

## F. Verification

Code gates completed: `npm test` — 90/90; `npm run typecheck`, `npm run lint`, `npm run build` — pass. Includes six Challenge tests and eight research-planning tests, plus all existing suites.

`python3 -m unittest discover tests` — 22 run, 2 dependency skips, no failures. `.venv/bin/python -m unittest discover tests` — 27/27 pass. Existing CSV ResourceWarning remains; it does not fail the gate. `python3 evaluation/impact-study/analyze.py` — `not_started`, zero participants, null metrics. `git diff --check` — pass.

Production preview: `env OPENAI_API_KEY='' ANTHROPIC_API_KEY='' npm run start -- --port 3420` after the final build. `python3 tests/check_research_routes.py` — **28/28 HTTP checks passed**: 19 page requests, five research exports, two legacy exports, an unknown-export 404 and a no-key Ask evidence-only response. The production server emitted no errors during these requests. This does not establish browser-console or hydration correctness. No live paid AI request was made.

Browser/mobile/keyboard/screen-reader/reduced-motion interaction checks and fresh screenshots remain **unverified**: CUA automatic approval review failed because the account usage limit was reached. It did not classify the action as unsafe. No alternate browser driver was used to bypass review. Native controls, visible focus, text labels, responsive CSS and static motion-free planning components were inspected in source, which is not a substitute for browser testing.

## G. Files changed by this pass

- Core: `apps/web/lib/mission-scenarios.ts`, `research-planning.ts`, `research-exports.ts`; shared condition comparator in `ontology.ts`; planning nodes/edges in `graph.ts`.
- Product: `components/ResearchPlanning.tsx`, `ResearchPlanning.module.css`; preset reuse in `MissionLab.tsx`; integration in `app/gaps/page.tsx`, `app/challenge/page.tsx`, `app/page.tsx`; download route and methodology.
- Verification: `lib/research-planning.test.ts`, `tests/test_impact_study.py`, `tests/check_research_routes.py`.
- Human impact: `evaluation/impact-study/{README.md,tasks.json,participant-template.csv,analyze.py}`.
- Documentation: README and this report.

Earlier scientific hardening is already in the baseline history; it was not reimplemented. Unrelated concurrent FlameScene/model work is excluded from this file list.

## H. Known limitations

Browser acceptance remains pending due to the approval-review limit. No deployment, push or new commit was made by this pass. The finite registry is deliberately small, contains no exact shared gaps today, and has no demand weighting. Coverage uses five dimensions and existing permissive project tolerances. Broad questions can appear covered while important geometry/platform requirements remain unknown. FM² mapping is conservative. Human scientific review of the planning rules is still needed. No human Flame Vision validation or usability study results are fabricated.

P2 read-only APIs were skipped: the existing download architecture supplies the requested reusable interface. Automatic ingestion and additional animations were not added. A future source must enter an unreviewed inbox, undergo human scientific review and structured extraction, pass source checks/tests, and only then enter the trusted corpus; no code automates that trust transition.

## I. 90-second professional demo

1. **0–15s:** Open `/challenge`, retain Exploration Atmosphere A, then select stage 7 “Uncertainty.” Show zero direct records for lunar PMMA and the individual condition coverage.
2. **15–30s:** Select stage 2 “Compare” to show closest NASA evidence and explicit mismatches; return to stage 8 “Next question.”
3. **30–45s:** Click “See how this gap compares with the whole research landscape.” The PMMA gap is selected on `/gaps`. Show missing dimensions, linked source evidence and separately labelled planned FM² overlap.
4. **45–60s:** Inspect recurring dimensions; change “Sort by” to “Evidence gain.” State that exact shared gaps are currently zero and related combinations remain distinct.
5. **60–80s:** Click “Inspect the candidate and remaining gaps.” Show the Martian SIBAL candidate, two covered gaps/questions, current 5/11 versus potential 7/11 condition coverage, and four remaining gaps.
6. **80–90s:** Open assumptions/limitations. Close: “This is condition coverage, not NASA prioritization or a predicted fire outcome.” Download the graph/registry if requested.

These are prepared click steps, not a claim that a human/browser demo was completed in this pass.

## J. Impact study status

**Not run. Zero real participants.** Six tasks, manual-versus-MicroFire protocol, counterbalancing/learning cautions, anonymous header-only CSV and descriptive paired analysis are ready. The synthetic analysis tests are not participant data. No public improvement metric is shown.

## K. Final pitch

MicroFire Atlas connects NASA combustion evidence to mission questions, then follows those questions into the research landscape. It shows which conditions are missing, keeps related gaps distinct, and compares hypothetical experiments by the condition coverage they could add. Every path leads back to checked sources; planned and hypothetical work remain separate from observations. The result supports transparent evidence review and research planning before formal engineering assessment.
