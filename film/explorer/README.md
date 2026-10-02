# MicroFire Atlas explorer film (3:05)

A Vox-style walkthrough of the real site: a child plays Mission Freefall and the Follow the Spark adventure, then the film shows the science underneath for mentors and judges.

- **Footage** is the live site, recorded with Chrome's screencast at 1920×1080 (`capture.mjs`). Each click is timed to the line that describes it. The finger cursor, tap ripples, key-phrase captions and the opening Earth-vs-orbit explainer are a recording-only overlay (`overlay.js`). The explainer is labelled as an illustration.
- **Voice**: Microsoft neural TTS, female voice Ava (`en-US-AvaMultilingualNeural`). Each sentence is voiced separately and joined with natural pauses (`narrate.py`). The film shows an "AI voiceover" tag.
- **Music**: a soft generated drone chord bed that ducks under the voice. There are no third-party tracks.
- **Facts** are checked against `apps/web/data`: 56 tests, all from the BASS-II summary report (25 PMMA, 31 SIBAL fabric), and 33 findings verified word for word at build time. In the B20 → B16 example, the airflow is turned down, B16 quenched, and the record is on PDF p. 111.

```bash
# site running on :3417 (cd apps/web && npm run build && npx next start -p 3417)
EDGE_TTS=/path/to/edge-tts python3 narrate.py   # build/<scene>.wav + build/timed.json
node capture.mjs                                 # build/frames/<scene>/ (about 3.5 min, real time)
python3 assemble.py                              # MicroFire-Atlas-explorer-film.mp4
```
