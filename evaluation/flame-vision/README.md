# Real NASA frame validation

**Not yet validated against hand-annotated real frames.** The manifest is empty. Synthetic arithmetic tests are not scientific validation. No algorithm output has been declared ground truth.

Run from the repository root:

```sh
.venv/bin/python evaluation/flame-vision/evaluate.py
python3 -m unittest discover tests
```

## Human annotation contract

Select real NASA frames across bright, dim-blue, weak/no-flame, complex-background and overexposed cases. Record the NASA URL, timestamp, pipeline version/configuration and original full-resolution frame. A human must independently draw or explicitly correct and approve the flame mask. Freeze annotations before tuning segmentation. Have a second reviewer adjudicate ambiguous boundaries where possible. Keep evaluation frames separate from tuning frames.

Export the pipeline segmentation at that same timestamp as a separate prediction mask. Do not use its output unchanged as ground truth. Masks must be full-frame single-channel PNGs: background 0, flame 255. Do not resize, fit, crop or align either mask to improve the result. Use a consistent flame class (luminous, blue or union). The evaluator checks hashes and dimensions; it cannot authenticate human review.

Every manifest entry requires `id`, `source_url`, `timestamp_s`, `approved_by_human: true`, `reviewer`, `approved_at`, `valid: true`, `overexposed: false`, `frame`, `truth`, `prediction`, the three corresponding `*_sha256` hashes, and `leading_edge_direction` (`right`, `left`, `up`, `down`). Include `flame_class`, `pipeline_version`, `pipeline_config` and review notes for provenance. Paths must remain inside this directory, usually under `annotations/`. No fabricated annotations are included.

## Metrics and exclusions

- IoU = intersection / union; Dice = twice intersection / total mask areas. Both empty = 1; exactly one empty = 0.
- Centroid: Euclidean error in full-frame pixels. Bounding box: mean absolute error of its four coordinate edges. Leading edge: absolute error of the furthest pixel along the declared propagation direction. Locations are undefined if either mask is empty and excluded from their own denominator.
- Relative area error: absolute predicted-minus-human area / human area, undefined when human area is zero. Empty prediction against nonempty truth = 1.
- Unapproved, invalid, overexposed, unclassified, corrupt, nonbinary or misaligned entries are excluded with reasons, never silently scored as accurate. Always report exclusions and examine failed frames separately.

Output gives per-frame values and macro means with a denominator per metric. Empty batches produce `not_validated` and null means. A scored batch is not certification or proof of performance outside those frames. Keep the website warning until reviewed real-frame annotations and documented results justify changing it.
