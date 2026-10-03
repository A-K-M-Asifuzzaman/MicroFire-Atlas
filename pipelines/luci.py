"""LUCI: the first extended burns in simulated lunar gravity, kept as their own family (not orbit, not the Moon's surface).

Every value in data/curated/luci_runs.json carries the exact NASA text and PDF page it came from. The build fails
unless that text is on that page (NTRS 20250010653) and contains the value itself.
"""
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
CURATED = ROOT / "data" / "curated"
SQUASH = lambda s: " ".join(s.split())
_pages = {}


def page_text(ntrs_id, page):
    key = (ntrs_id, page)
    if key not in _pages:
        pdf = ROOT / "data" / "raw" / "ntrs" / f"{ntrs_id}.pdf"
        _pages[key] = SQUASH(subprocess.run(["pdftotext", "-layout", "-f", str(page), "-l", str(page), str(pdf), "-"], check=True, capture_output=True, text=True).stdout)
    return _pages[key]


def shown(v):
    """How a value appears in NASA's text: 0.92 is written '.92', 20 as '20'."""
    if isinstance(v, (int, float)):
        s = f"{v:g}"
        return s[1:] if s.startswith("0.") else s
    return str(v)


def check(ntrs_id, rid, name, cite):
    text = SQUASH(cite["text"])
    if text not in page_text(ntrs_id, cite["page"]):
        raise ValueError(f"{rid}.{name}: text not on PDF p. {cite['page']}: {text}")
    if shown(cite["value"]).lower() not in text.lower():
        raise ValueError(f"{rid}.{name}: value {cite['value']!r} not in its cited text: {text}")


def build_luci(sources):
    ntrs = {s["source_id"]: s["ntrs_id"] for s in sources}["luci"]
    data = json.loads((CURATED / "luci_runs.json").read_text(encoding="utf-8"))
    for name, cite in data["common"].items():
        check(ntrs, "common", name, cite)
    runs = []
    for r in data["runs"]:
        f = r["fields"]
        for name, cite in f.items():
            check(ntrs, r["id"], name, cite)
        cite = lambda k: {"source_id": "luci", "pdf_page": f[k]["page"], "quote": f[k]["text"]} if k in f else None
        runs.append({
            "id": r["id"], "sample": r["sample"], "material": r["material"], "material_verbatim": f["material_verbatim"]["value"],
            "size_verbatim": f["size"]["value"], "direction": f["direction"]["value"],
            "o2_start_pct": f["o2_start_pct"]["value"], "o2_end_pct": f["o2_end_pct"]["value"],
            "pressure_kpa": 101.3, "pressure_basis": "stated as normal pressure",
            "spread_base_mm_s": f.get("spread_base_mm_s", {}).get("value"), "spread_tip_mm_s": f.get("spread_tip_mm_s", {}).get("value"),
            "gravity": "lunar", "gravity_note": "Simulated lunar gravity on a spinning sounding rocket (centrifugal acceleration, Coriolis force present), burns of about 2.5 minutes",
            "outcome_group": r["outcome_group"], "outcome_label": r["outcome_label"],
            "provenance": {k: cite(k) for k in ("material_verbatim", "size", "direction", "o2_start_pct", "o2_end_pct", "spread_base_mm_s", "spread_tip_mm_s", "outcome")}
            | {"gravity": {"source_id": "luci", "pdf_page": data["common"]["gravity"]["page"], "quote": data["common"]["gravity"]["text"]},
               "pressure": {"source_id": "luci", "pdf_page": data["common"]["pressure"]["page"], "quote": data["common"]["pressure"]["text"]}},
        })
    return runs
