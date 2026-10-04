"""Synthetic checks of analysis arithmetic; not participant observations."""
import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
PATH = ROOT / "evaluation/impact-study"
spec = importlib.util.spec_from_file_location("impact", PATH / "analyze.py")
impact = importlib.util.module_from_spec(spec)
spec.loader.exec_module(impact)


class ImpactAnalysis(unittest.TestCase):
    def test_no_participants_means_no_claim(self):
        result = impact.analyze(PATH / "participant-template.csv")
        self.assertEqual(result["status"], "not_started")
        self.assertEqual(result["participants"], 0)
        self.assertIsNone(result["by_condition"]["microfire"]["median_seconds"])

    def test_paired_arithmetic_and_invalid_input(self):
        header = (PATH / "participant-template.csv").read_text().rstrip() + "\n"
        with tempfile.TemporaryDirectory() as directory:
            p = pathlib.Path(directory) / "synthetic.csv"
            p.write_text(header + "test-only,evidence,manual,100,0,1,0,1,0,3\ntest-only,evidence,microfire,60,1,1,1,1,1,4\n")
            result = impact.analyze(p)
            self.assertEqual(result["participants"], 1)
            self.assertEqual(result["paired_difference"]["median_seconds_microfire_minus_manual"], -40)
            self.assertEqual(result["paired_difference"]["accuracy_microfire_minus_manual"]["completion_success"], 1)
            for bad in ("NaN", "-1", "Infinity"):
                p.write_text(header + f"test-only,evidence,manual,{bad},0,1,0,1,0,3\n")
                with self.assertRaises(ValueError):
                    impact.analyze(p)
