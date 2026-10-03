"""Real-frame segmentation validation; empty manifests report no validation, never zero error."""
import argparse
import hashlib
import json
import math
from pathlib import Path

METRICS = ("iou", "dice", "centroid_error_px", "bbox_error_px", "leading_edge_error_px", "area_relative_error")


def measure(truth, prediction, direction="right"):
    """Masks are sets of full-frame (x,y) pixels; no alignment/scaling is fitted."""
    if direction not in ("right", "left", "up", "down"):
        raise ValueError("leading-edge direction must be specified")
    a, b = set(truth), set(prediction)
    intersection, union = len(a & b), len(a | b)
    result = dict.fromkeys(METRICS)
    result.update(iou=intersection / union if union else 1.0,
                  dice=2 * intersection / (len(a) + len(b)) if a or b else 1.0,
                  area_relative_error=abs(len(b) - len(a)) / len(a) if a else None)
    if a and b:
        def centroid(mask):
            return tuple(sum(p[i] for p in mask) / len(mask) for i in (0, 1))
        def bbox(mask):
            return tuple(fn(p[i] for p in mask) for fn, i in ((min, 0), (min, 1), (max, 0), (max, 1)))
        axis = 0 if direction in ("right", "left") else 1
        edge = max if direction in ("right", "down") else min
        result.update(centroid_error_px=math.dist(centroid(a), centroid(b)),
                      bbox_error_px=sum(abs(x-y) for x, y in zip(bbox(a), bbox(b))) / 4,
                      leading_edge_error_px=abs(edge(p[axis] for p in a) - edge(p[axis] for p in b)))
    return result


def verified_file(base, name, expected):
    path = (base / name).resolve()
    if not path.is_relative_to(base.resolve()):
        raise ValueError("annotation paths must stay inside the manifest directory")
    if not isinstance(expected, str) or len(expected) != 64 or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError("missing or incorrect SHA-256")
    return path


def evaluate(manifest_path):
    manifest_path = Path(manifest_path)
    manifest = json.loads(manifest_path.read_text())
    if manifest.get("version") != 1 or not isinstance(manifest.get("frames"), list):
        raise ValueError("expected version 1 and a frames array")
    rows, seen = [], set()
    for frame in manifest["frames"]:
        row = {"id": frame.get("id"), "status": "excluded", "metrics": None}
        try:
            if not row["id"] or row["id"] in seen:
                raise ValueError("missing or duplicate frame id")
            seen.add(row["id"])
            if frame.get("approved_by_human") is not True or not frame.get("reviewer") or not frame.get("approved_at"):
                raise ValueError("human approval, reviewer and date required")
            if not frame.get("source_url") or not isinstance(frame.get("timestamp_s"), (int, float)) or not math.isfinite(frame["timestamp_s"]) or frame["timestamp_s"] < 0:
                raise ValueError("NASA source URL and finite nonnegative timestamp required")
            if frame.get("valid") is not True or frame.get("overexposed") is not False:
                raise ValueError("invalid, overexposed or unclassified frame; human review required")
            import cv2  # existing pipeline dependency; empty manifests need only stdlib
            images = []
            for key in ("frame", "truth", "prediction"):
                p = verified_file(manifest_path.parent, frame[key], frame[key + "_sha256"])
                img = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
                if img is None:
                    raise ValueError("unreadable frame/mask")
                images.append(img)
            original, truth, prediction = images
            if original.shape != truth.shape or truth.shape != prediction.shape:
                raise ValueError("masks must match full-frame dimensions")
            if any(not ((mask == 0) | (mask == 255)).all() for mask in (truth, prediction)):
                raise ValueError("binary masks must contain only 0 and 255")
            def points(mask):
                # ponytail: sets suit small reviewed batches; vectorize for large annotation corpora.
                ys, xs = (mask > 0).nonzero()
                return set(zip(xs.tolist(), ys.tolist()))
            row.update(status="scored", metrics=measure(points(truth), points(prediction), frame["leading_edge_direction"]))
        except (ValueError, KeyError, OSError, ImportError, TypeError) as error:
            row["reason"] = str(error)
        rows.append(row)
    scored = [r for r in rows if r["status"] == "scored"]
    metrics = {}
    for name in METRICS:
        values = [r["metrics"][name] for r in scored if r["metrics"][name] is not None]
        metrics[name] = {"mean": sum(values) / len(values) if values else None, "n": len(values)}
    return {"status": "annotated_batch_scored" if scored else "not_validated", "submitted": len(rows),
            "scored": len(scored), "excluded": len(rows)-len(scored), "metrics": metrics, "frames": rows}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=Path(__file__).with_name("manifest.json"))
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = json.dumps(evaluate(args.manifest), indent=2, allow_nan=False) + "\n"
    if args.output:
        args.output.write_text(report)
    print(report, end="")
