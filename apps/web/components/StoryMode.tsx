"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CloudPoint, FlameScene, SceneState } from "@/components/three/FlameScene";
import { Cite } from "@/components/Cite";
import { experiments, findings, getExperiment } from "@/lib/data";
import { PREDICTIONS, STEPS, type Step } from "@/lib/story";

const HEX: Record<string, string> = {
  sustained_no_blowoff: "#f0a044",
  burned_entire_sample: "#f0a044",
  burned_outcome_not_stated: "#f0a044",
  quenched_low_flow: "#5b8cff",
  extinguished_flow_off: "#5b8cff",
  no_sustained_flame: "#5b8cff",
  blowoff: "#d6e4ff",
  not_ignited: "#4a5570",
};
const LANE: Record<string, number> = { PMMA: -1.3, "SIBAL fabric": 0, Nomex: 1.3 };

/** Real tests placed in 3D: x = airflow (log), y = oxygen, z = material lane. */
function cloudPoints(): CloudPoint[] {
  return experiments
    .filter((e) => e.flow_initial_cm_s != null && e.oxygen_vol_pct != null)
    .map((e, i) => {
      const f = e.flow_final_cm_s ?? e.flow_initial_cm_s!;
      return {
        id: e.id,
        label: e.test_id,
        x: -4 + (Math.log(f) / Math.log(60)) * 8,
        y: -2 + ((e.oxygen_vol_pct! - 13.5) / 8) * 4,
        z: (LANE[e.material] ?? 0) + (((i * 37) % 7) - 3) * 0.09,
        color: HEX[e.outcome] ?? "#8f9ab1",
        hollow: e.outcome === "burned_outcome_not_stated" || e.outcome === "no_sustained_flame",
      };
    });
}

/* ---------- tiny synthesized sound (off by default) ---------- */
function useSound() {
  const ctx = useRef<AudioContext | null>(null);
  const [on, setOn] = useState(false);
  const play = useCallback(
    (kind: "tick" | "right" | "wrong" | "whoosh") => {
      if (!on) return;
      ctx.current ??= new AudioContext();
      const a = ctx.current, t = a.currentTime;
      const g = a.createGain();
      g.connect(a.destination);
      if (kind === "whoosh") {
        const buf = a.createBuffer(1, a.sampleRate * 0.6, a.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = a.createBufferSource();
        const f = a.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.setValueAtTime(400, t);
        f.frequency.exponentialRampToValueAtTime(1800, t + 0.5);
        src.buffer = buf;
        src.connect(f).connect(g);
        g.gain.setValueAtTime(0.18, t);
        src.start(t);
        return;
      }
      const notes = kind === "right" ? [660, 990] : kind === "wrong" ? [300, 220] : [880];
      notes.forEach((hz, i) => {
        const o = a.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(hz, t + i * 0.09);
        const og = a.createGain();
        og.gain.setValueAtTime(0, t + i * 0.09);
        og.gain.linearRampToValueAtTime(0.12, t + i * 0.09 + 0.01);
        og.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.25);
        o.connect(og).connect(a.destination);
        o.start(t + i * 0.09);
        o.stop(t + i * 0.09 + 0.3);
      });
    },
    [on],
  );
  return { on, setOn, play };
}

export function StoryMode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<FlameScene | null>(null);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [gravityOn, setGravityOn] = useState(true);
  const [noGL, setNoGL] = useState(false);
  const [done, setDone] = useState(false);
  const sound = useSound();
  const cloud = useMemo(() => cloudPoints(), []);

  const step: Step = STEPS[i];
  const chosen = answers[step.id];
  const revealed = step.predict ? chosen != null : true;
  const score = STEPS.filter((s) => s.predict && answers[s.id] != null && s.predict.choices[answers[s.id]].correct).length;

  const sceneState = useCallback(
    (s: Step, afterReveal: boolean, gravity: boolean): SceneState => {
      let st: SceneState = { ...s.scene, cloud };
      if (s.action?.kind === "gravity") st = { ...st, gravity: gravity ? "earth" : "orbit", outcome: gravity ? "burning" : "dim" };
      if (afterReveal && s.predict) st = { ...st, ...s.predict.after };
      return st;
    },
    [cloud],
  );

  // boot the 3D scene once the briefing is dismissed
  useEffect(() => {
    if (!started || !canvasRef.current || sceneRef.current) return;
    let cancelled = false;
    if (noGL) return;
    import("@/components/three/FlameScene").then(({ FlameScene }) => {
      if (cancelled || !canvasRef.current) return;
      sceneRef.current = new FlameScene(canvasRef.current, sceneState(STEPS[0], false, true));
    });
    const onVis = () => sceneRef.current?.setRunning(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [started, sceneState, noGL]);

  useEffect(() => () => sceneRef.current?.dispose(), []);

  // push state to the scene whenever the step, reveal or toggle changes
  useEffect(() => {
    sceneRef.current?.setState(sceneState(step, revealed && chosen != null, gravityOn));
  }, [step, revealed, chosen, gravityOn, sceneState]);

  const go = useCallback(
    (d: 1 | -1) => {
      if (d === 1 && step.predict && chosen == null) return;
      if (d === 1 && i === STEPS.length - 1) {
        setDone(true);
        window.scrollTo(0, 0);
        sound.play("whoosh");
        return;
      }
      const n = Math.max(0, Math.min(STEPS.length - 1, i + d));
      if (n !== i) {
        setI(n);
        setGravityOn(STEPS[n].scene.gravity === "earth");
        sound.play("tick");
      }
    },
    [i, step, chosen, sound],
  );

  useEffect(() => {
    if (!started || done) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, started, done]);

  const choose = (k: number) => {
    if (chosen != null) return;
    setAnswers((a) => ({ ...a, [step.id]: k }));
    sound.play(step.predict!.choices[k].correct ? "right" : "wrong");
  };

  const live = sceneState(step, revealed && chosen != null, gravityOn);
  const test = step.predict?.testId ? getExperiment(step.predict.testId) : undefined;
  const quote = (id?: string) => (id ? findings.find((f) => f.id === id) : undefined);
  const evidence = quote(step.finding);
  const explain = quote(step.predict?.finding);

  /* ---------- briefing ---------- */
  if (!started)
    return (
      <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden flex items-center">
        <div className="absolute inset-0 story-stars" aria-hidden="true" />
        <div className="absolute -right-40 top-10 w-[640px] h-[640px] rounded-full story-orb" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] items-center w-full">
          <div>
            <p className="text-signal text-sm font-semibold">Flight Log, mission 01</p>
            <h1 className="display text-5xl sm:text-6xl lg:text-7xl mt-4 max-w-[13ch]">Can you predict a fire in space?</h1>
            <p className="mt-6 text-lg text-muted max-w-[48ch]">
              You are the fire-safety officer. Real tests from the International Space Station play out in front of you. Call
              each one before NASA&apos;s record reveals what really happened.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  setNoGL(!document.createElement("canvas").getContext("webgl2"));
                  setStarted(true);
                  window.scrollTo(0, 0);
                  sound.play("whoosh");
                }}
                className="story-cta"
              >
                Start the mission
              </button>
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input type="checkbox" checked={sound.on} onChange={(e) => sound.setOn(e.target.checked)} className="accent-[var(--signal)]" />
                Sound effects
              </label>
            </div>
            <p className="mt-6 text-sm text-faint">
              {STEPS.length} scenes, {PREDICTIONS} predictions, about 3 minutes. Every outcome is a real NASA record.
            </p>
          </div>
          <ol className="grid gap-3 text-[15px]">
            {[
              ["Feel the difference", "Switch gravity off and watch a flame change shape."],
              ["Board the ISS", "Step into the wind tunnel astronauts used in 2014."],
              ["Make the call", "Predict three real tests on the same material."],
              ["Find the edge", "See where NASA's evidence stops, before Moon and Mars."],
            ].map(([t, d], k) => (
              <li key={t} className="story-brief-card">
                <span className="story-brief-num">{k + 1}</span>
                <span>
                  <span className="block font-semibold text-ink">{t}</span>
                  <span className="text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );

  /* ---------- debrief ---------- */
  if (done) {
    const rank = score === PREDICTIONS ? "Evidence-first officer" : score >= PREDICTIONS - 1 ? "Sharp instincts" : "Fresh recruit";
    return (
      <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden flex items-center">
        <div className="absolute inset-0 story-stars" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
          <p className="text-signal text-sm font-semibold">Mission debrief</p>
          <h1 className="display text-5xl sm:text-6xl mt-4">{rank}</h1>
          <p className="mt-6 text-2xl">
            You matched NASA&apos;s evidence on <span className="text-signal num">{score}</span> of {PREDICTIONS} calls.
          </p>
          <ul className="mt-8 grid gap-2 text-left max-w-xl mx-auto">
            {STEPS.filter((s) => s.predict).map((s) => {
              const ok = answers[s.id] != null && s.predict!.choices[answers[s.id]].correct;
              return (
                <li key={s.id} className="flex items-center gap-3 border border-rule rounded-sm px-4 py-3 bg-panel">
                  <span className={ok ? "text-signal" : "text-flame"} aria-hidden="true">{ok ? "✓" : "✗"}</span>
                  <span className="sr-only">{ok ? "Matched" : "Missed"}:</span>
                  <span className="font-medium">{s.chapter}</span>
                  <span className="text-muted text-sm ml-auto text-right">{s.predict!.choices.find((c) => c.correct)!.label}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-8 text-muted max-w-[52ch] mx-auto">
            The last call is the point: past evidence ends where future crews will live. That is where new experiments matter.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/mission" className="story-cta">Plan your own mission</Link>
            <Link href="/atlas" className="border border-rule-strong px-5 py-3 rounded-sm hover:border-signal">Explore all {experiments.length} tests</Link>
            <button onClick={() => { setDone(false); setI(0); setAnswers({}); setGravityOn(true); }} className="border border-rule-strong px-5 py-3 rounded-sm hover:border-signal">
              Play again
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- mission ---------- */
  return (
    <section className="fixed inset-x-0 bottom-0 top-14 z-30 overflow-hidden bg-void" aria-label="Story mode">
      <div className="absolute inset-0 story-stars" aria-hidden="true" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" aria-hidden="true" />
      {noGL && (
        <p className="absolute inset-x-0 top-1/3 text-center text-muted">3D is not available on this device. The story still works below.</p>
      )}

      {/* instrument readout */}
      <div className="hidden sm:block absolute right-6 top-6 story-hud" aria-hidden="true">
        <div><span>O₂</span><b className="num">{live.o2}%</b></div>
        <div><span>Airflow</span><b className="num">{live.view === "bench" ? 0 : live.flow} cm/s</b></div>
        <div><span>Gravity</span><b>{live.gravity === "earth" ? "1 g" : "~0 g"}</b></div>
        <div><span>Flame</span><b className={live.outcome === "quench" || live.outcome === "dim" ? "text-quench" : live.outcome === "blowoff" ? "text-blowoff" : live.outcome === "none" ? "text-faint" : "text-flame"}>
          {{ burning: "burning", quench: "quenching", blowoff: "blowing off", dim: "dim blue", none: live.view === "cloud" ? "data view" : "out" }[live.outcome]}
        </b></div>
        <p className="text-[11px] text-faint mt-2">Illustration, not a simulation. Drag to rotate.</p>
      </div>

      {/* progress */}
      <div className="absolute left-4 sm:left-6 top-4 sm:top-6 flex items-center gap-3">
        <ol className="flex gap-1.5" aria-label="Progress">
          {STEPS.map((s, k) => (
            <li key={s.id} className={`h-1.5 w-6 sm:w-8 rounded-full ${k < i ? "bg-signal" : k === i ? "bg-ink" : "bg-rule-strong"}`}>
              <span className="sr-only">{k === i ? `Scene ${k + 1} of ${STEPS.length}, current` : `Scene ${k + 1}`}</span>
            </li>
          ))}
        </ol>
        <span className="text-xs text-muted num">Score {score}/{PREDICTIONS}</span>
        <button onClick={() => sound.setOn(!sound.on)} className="text-xs text-muted border border-rule rounded-sm px-2 py-1 hover:text-ink" aria-pressed={sound.on}>
          Sound {sound.on ? "on" : "off"}
        </button>
      </div>

      {/* console */}
      <div key={step.id} className="story-panel absolute left-4 right-4 bottom-4 sm:left-6 sm:right-auto sm:bottom-6 sm:w-[520px] max-h-[62vh] overflow-y-auto">
        <p className="flex items-center gap-2 text-xs">
          <span className={`story-voice ${step.voice === "NASA record" ? "story-voice-nasa" : step.voice === "MicroFire Atlas" ? "story-voice-atlas" : ""}`}>{step.voice}</span>
          <span className="text-muted">{step.chapter}</span>
        </p>
        <h2 className="display text-2xl sm:text-3xl mt-3">{step.title}</h2>
        <p className="mt-3 text-[16px] text-[#c9d1e3]">{step.body}</p>

        {step.action && (
          <button
            onClick={() => {
              if (step.action!.kind === "gravity") setGravityOn((g) => !g);
              else sceneRef.current?.gust();
              sound.play("whoosh");
            }}
            className="mt-4 story-action"
          >
            {step.action.kind === "gravity" ? (gravityOn ? "Switch off gravity" : "Switch gravity back on") : step.action.label}
          </button>
        )}

        {step.predict && (
          <fieldset className="mt-5">
            <legend className="font-semibold">{step.predict.question}</legend>
            <div className="mt-3 grid gap-2">
              {step.predict.choices.map((c, k) => {
                const picked = chosen === k;
                const state = chosen == null ? "" : c.correct ? "story-choice-right" : picked ? "story-choice-wrong" : "opacity-50";
                return (
                  <button key={c.label} onClick={() => choose(k)} disabled={chosen != null} aria-pressed={picked} className={`story-choice ${state}`}>
                    <span className="story-choice-key">{String.fromCharCode(65 + k)}</span>
                    {c.label}
                    {chosen != null && c.correct && <span className="ml-auto text-xs">{step.predict!.testId ? "NASA record" : "Atlas evidence"}</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {step.predict && chosen != null && (
          <div className="mt-4 story-reveal" role="status">
            <p className="font-semibold">{step.predict.choices[chosen].correct ? "You called it." : "Not quite."} {step.predict.reveal}</p>
            {test && (
              <p className="mt-2 text-sm text-muted">
                Crew and ground note for {test.test_id}: “{test.observations_verbatim}”{" "}
                <Cite sourceId={test.provenance.record.source_id} page={test.provenance.record.pdf_page} where={test.provenance.record.table} />
              </p>
            )}
            {explain && (
              <p className="mt-2 text-sm text-muted">
                NASA&apos;s explanation: “{explain.quote}” <Cite sourceId={explain.source_id} page={explain.pdf_page} />
              </p>
            )}
          </div>
        )}

        {evidence && (!step.predict || chosen != null) && (
          <p className="mt-4 text-sm text-muted border-l-2 border-rule-strong pl-3">
            “{evidence.quote}” <Cite sourceId={evidence.source_id} page={evidence.pdf_page} />
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <button onClick={() => go(-1)} disabled={i === 0} className="text-sm text-muted hover:text-ink disabled:opacity-30">
            Back
          </button>
          <span className="text-xs text-faint hidden sm:inline">← → keys work too</span>
          <button onClick={() => go(1)} disabled={!revealed} className="story-cta !py-2.5 !px-5 disabled:opacity-40">
            {i === STEPS.length - 1 ? "Finish mission" : step.predict && !revealed ? "Make your call" : "Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}
