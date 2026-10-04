# MicroFire Atlas: the full guided tour (≈ 7 min)

A narrated walkthrough of the whole website for someone seeing it for the first time. The competition film
(`film/explorer`, under 4 minutes) is the pitch; this video explains every part:

| Part | Scenes | What it shows |
|---|---|---|
| Opening | `coldopen`, `what` | Real Saffire VI footage, the challenge, the problem, two ways in |
| One | `challenge` | Challenge Mode: Find, Compare, Summarize, Rank, Gap, Next, "MicroFire says no" |
| Two | `atlas`, `compare`, `saffire` | 78 NASA test records, the detective table, page-level provenance, Compare Lab, Saffire |
| Three | `analyst` | Mission Analyst: NASA-studied atmosphere, evidence ticks, evidence status, "Why #1?", bounded insight, brief |
| Four | `frontier`, `ask`, `trust`, `sources` | Fire-safety matrix, research planner, FM² horizon, checked AI, robustness, benchmarks, open data |
| Five | `explorer` | Mission Freefall (3D BASS-II build), Follow the Spark (computer vision, predict first) |
| Close | `close` | End card |

It reuses the competition film's engine, which renders the real site frame by frame in 4K at 60 fps:

```sh
cd film/guide
EDGE_TTS=/path/to/edge-tts python3 ../explorer/narrate.py      # voice: build/*.wav + build/timed.json
SCENES=scenes.mjs SITE=http://localhost:3417 node ../explorer/capture.mjs all
CHAPTERS=challenge,atlas,analyst,frontier,explorer python3 ../explorer/score.py
OUT=MicroFire-Atlas-guided-tour.mp4 python3 ../explorer/assemble.py
```

Narration is an AI voice (Edge neural TTS, Ava); the end card discloses it. Every claim in `script.json` is
checked against the live site: no safety ratings, probabilities or invented results.
