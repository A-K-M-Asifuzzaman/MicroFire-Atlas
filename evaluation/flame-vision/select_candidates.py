"""Pick candidate frames for human flame annotation. Candidates are NOT annotations.

Stratifies the pipeline's own sampled frames from both NASA Saffire videos by condition (clean bright,
overexposed, weak or no flame, many flamelets, blue-dominant) and spreads picks across time, so a reviewer
sees the hard cases, not only the easy ones. For each candidate it writes the original full-resolution frame
and the pipeline's prediction mask (luminous | blue, ROI applied, 0/255) under candidates/, with hashes.
A human then draws the truth mask independently in the dev tool (/dev/flame-annotation).

    .venv/bin/python evaluation/flame-vision/select_candidates.py
"""
import hashlib
import json
import pathlib
import sys

import cv2
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / "pipelines"))
from flame_vision import CONFIG, VERSION, masks, roi_pixels  # noqa: E402

SLUGS = ["saffire-v-ribs", "saffire-vi-pmma"]
PER_VIDEO = 20
MIN_GAP_S = 1.5
OUT = HERE / "candidates"


def condition(f):
    if "overexposed" in f["flags"]:
        return "overexposed"
    if "weak_or_no_flame" in f["flags"]:
        return "weak_or_no_flame"
    if "many_regions" in f["flags"]:
        return "many_flamelets"
    if f["blue_px"] > f["luminous_px"]:
        return "blue_dominant"
    return "clean_bright"


def pick(frames):
    """Round-robin across conditions, taking evenly spaced frames within each, at least MIN_GAP_S apart."""
    groups = {}
    for f in frames:
        groups.setdefault(condition(f), []).append(f)
    queues = {}
    for c, fs in groups.items():
        k = min(len(fs), PER_VIDEO)
        queues[c] = [fs[round(i * (len(fs) - 1) / max(1, k - 1))] for i in range(k)] if k > 1 else fs[:1]
    chosen = []
    while len(chosen) < PER_VIDEO and any(queues.values()):
        for c in sorted(queues):
            while queues[c]:
                f = queues[c].pop(0)
                if all(abs(f["t"] - g["t"]) >= MIN_GAP_S for g, _ in chosen):
                    chosen.append((f, c))
                    break
            if len(chosen) == PER_VIDEO:
                break
    return sorted(chosen, key=lambda x: x[0]["t"])


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    media = {m["slug"]: m for m in json.loads((ROOT / "data" / "media.json").read_text())}
    OUT.mkdir(exist_ok=True)
    entries = []
    for slug in SLUGS:
        analysis = json.loads((ROOT / "apps" / "web" / "public" / "media" / slug / "analysis.json").read_text())
        path = ROOT / "data" / "raw" / "media" / f"{slug}.mp4"
        if sha(path) != analysis["input_sha256"]:
            raise SystemExit(f"{path} does not match the analysed video; run pipelines/fetch_media.py")
        chosen = pick(analysis["frames"])
        cap = cv2.VideoCapture(str(path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        wanted = {round(f["t"] * fps): (f, c) for f, c in chosen}
        i = 0
        cfg = CONFIG[slug]
        while wanted:
            ok, img = cap.read()
            if not ok:
                break
            if i in wanted:
                f, c = wanted.pop(i)
                H, W = img.shape[:2]
                x0, y0, x1, y1 = roi_pixels(cfg, W, H)
                lum, blue = masks(img[y0:y1, x0:x1], cfg)
                pred = np.zeros((H, W), np.uint8)
                pred[y0:y1, x0:x1][lum | blue] = 255
                cid = f"{slug}-t{f['t']:07.3f}".replace(".", "_")
                fp, pp = OUT / f"{cid}.frame.png", OUT / f"{cid}.prediction.png"
                cv2.imwrite(str(fp), img)
                cv2.imwrite(str(pp), pred)
                entries.append({
                    "id": cid, "slug": slug, "source_url": media[slug]["page_url"], "file_url": media[slug]["file_url"],
                    "timestamp_s": f["t"], "frame_index": i, "frame_size": [W, H], "selection_reason": c,
                    "frame": f"candidates/{fp.name}", "frame_sha256": sha(fp),
                    "prediction": f"candidates/{pp.name}", "prediction_sha256": sha(pp),
                    "pipeline_version": VERSION, "pipeline_config": {k: v for k, v in cfg.items() if not k.endswith("_note")},
                })
            i += 1
        cap.release()
    (HERE / "candidates.json").write_text(json.dumps({
        "version": 1,
        "status": "Candidate frames for human annotation. These are NOT annotations and NOT ground truth.",
        "selection": f"Up to {PER_VIDEO} per video, round-robin across pipeline conditions, evenly spaced in time, at least {MIN_GAP_S} s apart.",
        "frames": entries,
    }, indent=1) + "\n")
    counts = {}
    for e in entries:
        counts[e["selection_reason"]] = counts.get(e["selection_reason"], 0) + 1
    print(len(entries), "candidates", counts)


if __name__ == "__main__":
    main()
