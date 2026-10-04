"""Synthetic arithmetic checks ONLY, not human-labelled NASA validation results."""
import importlib.util
import json
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("validation", ROOT / "evaluation/flame-vision/evaluate.py")
validation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validation)


class ValidationArithmetic(unittest.TestCase):
    def test_masks_and_empty_cases(self):
        truth = {(0, 0), (1, 0), (0, 1), (1, 1)}
        same = validation.measure(truth, truth)
        self.assertEqual((same["iou"], same["dice"], same["centroid_error_px"]), (1, 1, 0))
        shifted = validation.measure(truth, {(x+1, y) for x, y in truth})
        self.assertAlmostEqual(shifted["iou"], 1/3)
        self.assertEqual(shifted["dice"], .5)
        self.assertEqual(shifted["centroid_error_px"], 1)
        self.assertEqual(shifted["bbox_error_px"], .5)
        self.assertEqual(shifted["leading_edge_error_px"], 1)
        self.assertEqual(shifted["area_relative_error"], 0)
        self.assertIsNone(validation.measure(set(), truth)["area_relative_error"])
        self.assertEqual(validation.measure(truth, set())["area_relative_error"], 1)
        self.assertIsNone(validation.measure(set(), set())["centroid_error_px"])

    def test_empty_unapproved_and_overexposed_are_not_validation(self):
        with tempfile.TemporaryDirectory() as d:
            p = pathlib.Path(d) / "manifest.json"
            for frames in ([], [{"id": "synthetic-unapproved"}], [{"id":"synthetic-overexposed", "approved_by_human":True, "reviewer":"synthetic test only", "approved_at":"test", "source_url":"https://example.invalid", "timestamp_s":0, "valid":True,"overexposed":True}]):
                p.write_text(json.dumps({"version":1, "frames":frames}))
                result = validation.evaluate(p)
                self.assertEqual(result["status"], "not_validated")
                self.assertEqual(result["excluded"], len(frames))
                self.assertTrue(all(m["mean"] is None for m in result["metrics"].values()))

    def test_bad_edge_and_path_are_rejected(self):
        with self.assertRaises(ValueError):
            validation.measure(set(), set(), "unknown")
        with self.assertRaises(ValueError):
            validation.verified_file(ROOT, "../outside.png", "0"*64)


class Candidates(unittest.TestCase):
    """The candidate list is a sampling plan, never annotations."""

    def test_candidate_manifest_is_a_plan_not_truth(self):
        c = json.loads((ROOT / "evaluation/flame-vision/candidates.json").read_text())
        self.assertTrue(30 <= len(c["frames"]) <= 50)
        self.assertIn("NOT annotations", c["status"])
        self.assertEqual({f["slug"] for f in c["frames"]}, {"saffire-v-ribs", "saffire-vi-pmma"})
        for f in c["frames"]:
            self.assertNotIn("truth", f)
            self.assertNotIn("approved_by_human", f)
            self.assertEqual(len(f["frame_sha256"]), 64)
        manifest = json.loads((ROOT / "evaluation/flame-vision/manifest.json").read_text())
        for f in manifest["frames"]:  # anything committed must carry a named human approval
            self.assertIs(f["approved_by_human"], True)
            self.assertTrue(f["reviewer"])

    @unittest.skipUnless(importlib.util.find_spec("cv2"), "needs OpenCV (.venv)")
    def test_pick_spreads_conditions_and_time(self):
        spec = importlib.util.spec_from_file_location("select", ROOT / "evaluation/flame-vision/select_candidates.py")
        sel = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(sel)
        frames = [{"t": i * 0.2, "flags": ["overexposed"] if i % 3 else [], "blue_px": 0, "luminous_px": 5} for i in range(300)]
        chosen = sel.pick(frames)
        self.assertEqual(len(chosen), sel.PER_VIDEO)
        self.assertEqual({c for _, c in chosen}, {"overexposed", "clean_bright"})
        ts = [f["t"] for f, _ in chosen]
        self.assertTrue(all(b - a >= sel.MIN_GAP_S - 1e-9 for a, b in zip(ts, ts[1:])))
        self.assertEqual(chosen, sel.pick(frames))
