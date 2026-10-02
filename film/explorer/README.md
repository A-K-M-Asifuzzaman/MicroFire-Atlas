# MicroFire Atlas explorer film (3:08, 4K, 60 fps)

A Vox-style walkthrough of the real site: a child plays Mission Freefall and the Follow the Spark adventure, then the film shows the science underneath for mentors and judges.

- **Footage** is the live site, rendered frame by frame on a virtual clock (`capture.mjs`), so it is perfectly smooth at 3840×2160 and 60 fps. Real-time screen capture stutters whenever Chrome pauses, so nothing here runs in real time:
  - Playwright's clock drives the page's timers and requestAnimationFrame;
  - every CSS animation is set to the frame's time through the Web Animations API;
  - videos are seeked frame by frame;
  - scrolling and the cursor are tweened.

  Each click is timed to the line that describes it.
- **Overlay**: the finger cursor, tap ripples, key-phrase captions, the opening Earth-vs-orbit explainer and the animated end card are a recording-only overlay (`overlay.js`). The explainer is labelled as an illustration. In the end card, a spark flies in and draws a flame constellation, then the title, the three promises, the crew, PIX and the link appear in turn.
- **Voice**: Microsoft neural TTS, female voice Ava (`en-US-AvaMultilingualNeural`). Each sentence is voiced separately and joined with natural pauses (`narrate.py`). The film shows an "AI voiceover" tag.
- **Music**: a soft generated drone chord bed that ducks under the voice. There are no third-party tracks.
- **Facts** are checked against `apps/web/data`: 56 tests, all from the BASS-II summary report (25 PMMA, 31 SIBAL fabric), and 33 findings verified word for word at build time. In the B20 → B16 example, the airflow is turned down, B16 quenched, and the record is on PDF p. 111.

```bash
# site running on :3417 (cd apps/web && npm run build && npx next start -p 3417)
EDGE_TTS=/path/to/edge-tts python3 narrate.py   # build/<scene>.wav + build/timed.json
node capture.mjs all                             # build/<scene>.mp4, 4K60 (about 20 min on an M3 Pro)
python3 assemble.py                              # MicroFire-Atlas-explorer-film.mp4
```
