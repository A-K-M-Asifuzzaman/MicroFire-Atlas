"""Descriptive pilot usability analysis. No data means no impact claim."""
import argparse
import csv
import json
import math
import statistics
from pathlib import Path

FIELDS = ("correct_relevant_source", "correct_evidence_rung", "correct_gap_identification", "correct_limitation", "completion_success")


def analyze(path):
    task_ids = {t["id"] for t in json.loads(Path(__file__).with_name("tasks.json").read_text())["tasks"]}
    rows, seen = [], set()
    with Path(path).open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        required = {"participant_id", "task_id", "condition", "task_completion_seconds", "participant_confidence", *FIELDS}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("Missing required CSV columns")
        for line, r in enumerate(reader, 2):
            key = (r["participant_id"], r["task_id"], r["condition"])
            if not r["participant_id"] or r["task_id"] not in task_ids or r["condition"] not in ("manual", "microfire") or key in seen:
                raise ValueError(f"Invalid/duplicate participant-task-condition at line {line}")
            seen.add(key)
            seconds, confidence = float(r["task_completion_seconds"]), float(r["participant_confidence"])
            if not math.isfinite(seconds) or seconds < 0 or not math.isfinite(confidence) or not 1 <= confidence <= 5:
                raise ValueError(f"Invalid time/confidence at line {line}")
            if any(r[f] not in ("0", "1") for f in FIELDS):
                raise ValueError(f"Accuracy/success fields must be 0 or 1 at line {line}")
            rows.append({**r, **{f:int(r[f]) for f in FIELDS}, "seconds":seconds, "confidence":confidence})

    def summary(rs):
        times = [r["seconds"] for r in rs]
        quartiles = statistics.quantiles(times, n=4, method="inclusive") if len(times) >= 2 else None
        return {"observations":len(rs), "participants":len({r["participant_id"] for r in rs}),
                "median_seconds":statistics.median(times) if times else None,
                "iqr_seconds":quartiles[2]-quartiles[0] if quartiles else None,
                "accuracy":{f:sum(r[f] for r in rs)/len(rs) if rs else None for f in FIELDS}}

    pairs = {}
    for r in rows:
        pairs.setdefault((r["participant_id"], r["task_id"]), {})[r["condition"]] = r
    paired = [p for p in pairs.values() if len(p) == 2]
    difference = {"matched_participant_tasks":len(paired),
                  "median_seconds_microfire_minus_manual":statistics.median([p["microfire"]["seconds"]-p["manual"]["seconds"] for p in paired]) if paired else None,
                  "accuracy_microfire_minus_manual":{f:sum(p["microfire"][f]-p["manual"][f] for p in paired)/len(paired) if paired else None for f in FIELDS}}
    return {"status":"pilot_observations_supplied" if rows else "not_started", "participants":len({r["participant_id"] for r in rows}),
            "by_condition":{c:summary([r for r in rows if r["condition"]==c]) for c in ("manual","microfire")},
            "by_task":{t:{c:summary([r for r in rows if r["task_id"]==t and r["condition"]==c]) for c in ("manual","microfire")} for t in sorted(task_ids)},
            "paired_difference":difference,"limitations":["Descriptive pilot only; no significance or population-effect claim.","Verify real participant consent and independent rubric scoring; this script cannot authenticate human observations.","Repeated tasks can introduce learning effects; report order and missing pairs."]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", nargs="?", type=Path, default=Path(__file__).with_name("participant-template.csv"))
    args = parser.parse_args()
    print(json.dumps(analyze(args.csv), indent=2, allow_nan=False))
