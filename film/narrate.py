"""Speaks each scene of script.json with macOS `say` (Samantha, rate 168) and records durations
in build/script-timed.json, which build-data.mjs uses to time the scenes."""
import json, os, subprocess
os.makedirs("build", exist_ok=True)
scenes = json.load(open("script.json"))
for sc in scenes:
    out = f"build/{sc['id']}.aiff"
    subprocess.run(["say", "-v", "Samantha", "-r", "168", "-o", out, sc["narration"]], check=True)
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True, check=True).stdout
    sc["audio"] = round(float(dur), 2)
json.dump(scenes, open("build/script-timed.json", "w"), indent=1)
print("total speech", round(sum(s["audio"] for s in scenes), 1), "s")
