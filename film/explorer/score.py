"""A small cinematic score, composed in code and timed to the film (no third-party music).

D major: Dmaj9 → Bm9 → Gmaj9 → A6sus, four seconds per chord. Warm detuned pads throughout; soft piano-like
arpeggios once the title has landed; a rising swell and a low impact on the title reveal; a bell on each chapter
card; arpeggios stop for the finale and the last chord resolves and fades. Writes build/music.wav.
    python3 score.py   (after narrate.py, which writes build/timed.json)
"""
import json, wave
import numpy as np

SR = 48000
timed = json.load(open("build/timed.json"))
T = sum(s["dur"] for s in timed)
start = {}; acc = 0.0
for s in timed: start[s["id"]] = acc; acc += s["dur"]
cold = timed[0]
title_at = cold["dur"] - 4.8 + 0.35          # the title reveal: just after the last cold-open line
chapters = [start[k] + 0.05 for k in ("freefall", "saffire", "frontier") if k in start]
finale = start.get("close", T - 18)

n = int(T * SR); t = np.arange(n) / SR
out = np.zeros(n)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
CHORDS = [[38, 50, 54, 57, 61, 64], [35, 47, 50, 54, 57, 61], [31, 43, 47, 50, 54, 57], [33, 45, 50, 52, 54, 57]]  # Dmaj9 Bm9 Gmaj9 A6sus
BAR = 4.0

# pads: two slightly detuned sines per note, chord crossfades every bar, slow breathing
for k in range(int(T // BAR) + 2):
    a, b = k * BAR - 1.0, (k + 1) * BAR + 1.0
    i0, i1 = max(0, int(a * SR)), min(n, int(b * SR))
    if i0 >= i1: continue
    tt = t[i0:i1]
    env = np.clip((tt - a) / 1.0, 0, 1) * np.clip((b - tt) / 1.0, 0, 1)
    chord = CHORDS[k % 4] if (k * BAR) < finale else CHORDS[0]  # the finale holds the home chord
    for m in chord:
        f = hz(m)
        out[i0:i1] += 0.028 * env * (np.sin(2 * np.pi * f * tt) + 0.6 * np.sin(2 * np.pi * f * 1.003 * tt + 1.3))

# arpeggios: plucked tones (fundamental + soft octave, exponential decay), eighth notes at 60 bpm
pattern = [2, 3, 4, 5, 4, 3, 4, 5]
step = 0.5
tk = title_at + 3.0
while tk < finale - 0.5:
    k = int(tk // BAR); chord = CHORDS[k % 4]; m = chord[pattern[int(round(tk / step)) % len(pattern)]] + 12
    i0 = int(tk * SR); L = int(1.6 * SR); i1 = min(n, i0 + L); tt = np.arange(i1 - i0) / SR
    env = np.exp(-tt * 3.2) * np.clip(tt / 0.006, 0, 1)
    ramp = min(1.0, (tk - title_at - 3.0) / 6.0)  # arpeggios fade in after the title
    f = hz(m)
    out[i0:i1] += 0.05 * ramp * env * (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt))
    tk += step

# title: a 3 s rising filtered-noise swell into a low impact
rng = np.random.default_rng(3)
s0 = int((title_at - 3.0) * SR); s1 = int(title_at * SR)
noise = rng.standard_normal(s1 - s0)
noise = np.convolve(noise, np.ones(40) / 40, mode="same")  # soften
out[s0:s1] += 0.10 * noise * np.linspace(0, 1, s1 - s0) ** 2
i0 = s1; L = int(3.5 * SR); tt = np.arange(L) / SR
out[i0:i0 + L] += 0.35 * np.exp(-tt * 1.6) * np.sin(2 * np.pi * (42 + 18 * np.exp(-tt * 6)) * tt)

# chapter bells: inharmonic partials, long decay
for c in chapters:
    i0 = int(c * SR); L = int(3.0 * SR); tt = np.arange(min(L, n - i0)) / SR
    bell = sum(a * np.sin(2 * np.pi * hz(81) * r * tt) for a, r in [(1, 1), (.5, 2.76), (.25, 5.4)])
    out[i0:i0 + len(tt)] += 0.06 * np.exp(-tt * 1.8) * bell

# finale swell and fade
fi = int(finale * SR)
out[fi:] *= np.linspace(1, 1.5, n - fi)
out *= np.clip((t - 0) / 2.5, 0, 1) * np.clip((T - t) / 5.0, 0, 1)
out = out / max(1e-9, np.abs(out).max()) * 0.8
stereo = np.stack([out, np.roll(out, int(0.012 * SR))], axis=1)  # a touch of width
with wave.open("build/music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype("<i2").tobytes())
print(f"score: {T:.1f} s, title at {title_at:.1f} s, chapters {[round(c, 1) for c in chapters]}, finale {finale:.1f} s")
