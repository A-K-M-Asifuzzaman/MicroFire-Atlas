# Pilot usability evaluation — not yet run

No real participants have been tested. The CSV contains a header only. Do not publish time savings or accuracy improvement without collected, reviewed observations.

## Protocol

Recruit consenting adults who review technical evidence; assign random anonymous IDs. Do not collect names, contacts, health data or other sensitive details. Record the study date, frozen Git commit, source-manifest identity, browser, task order and participant experience in aggregate. Have an independent human scientific reviewer approve `tasks.json` and freeze the rubric before the study.

Each participant reviews the six tasks using (A) manual NASA/NTRS/source navigation and (B) MicroFire. Provide both conditions the same source corpus and mission-scenario registry; task 6 needs that finite registry for a fair manual comparison. Alternate starting condition and task order between participants. Repeating the exact task introduces learning; report this limitation and use balanced order or parallel task variants where practical. Give the same training and time limit in both conditions.

Start the clock at task reveal; stop at submitted answer or timeout. Record actual elapsed seconds including unsuccessful attempts, binary rubric fields, success, and self-rated confidence 1–5. Define timeout/partial-credit policy before recruitment. Score source/rung/gap/limitation fields independently; participant confidence is not correctness. For a field not relevant to a task, revise the rubric first rather than silently coding missing values as correct. Human judges should score without knowing condition where feasible.

Use a private working copy of `participant-template.csv`. Rows identify participant, task, condition (`manual` or `microfire`), time, five 0/1 fields and confidence. No fabricated examples are included. Preserve consent records separately. Commit only appropriately anonymized observations with consent, not personal details.

```sh
python3 evaluation/impact-study/analyze.py
python3 evaluation/impact-study/analyze.py /path/to/real-anonymous-observations.csv
```

The first command returns `not_started` and null metrics. Real-data reports provide unique participant counts, median/IQR time, completion/source/rung/gap/limitation accuracy, task-level summaries and paired MicroFire-minus-manual differences. No significance testing. Negative paired time differences indicate shorter observed times, not proof of a population effect. Report missing pairs, learning effects, sample size and participant expertise beside any results. The website must keep “Human usability impact study pending” until the study is actually run and independently reviewed.
