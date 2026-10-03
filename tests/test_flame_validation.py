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
