"use client";

import { useEffect, useRef, useState } from "react";
import type { FlameScene, SceneState } from "@/components/three/FlameScene";
import { getExperiment } from "@/lib/data";

/** The three B-tests, each shown burning at its starting flow, then playing out NASA's recorded outcome. */
const ACTS: { id: string; start: number; end: number; outcome: SceneState["outcome"]; caption: string }[] = [
  { id: "bass2-B16", start: 3, end: 0.6, outcome: "quench", caption: "Fan turned down: the flame quenched" },
  { id: "bass2-B20", start: 5, end: 3, outcome: "burning", caption: "Moderate flow: it burned the entire sample" },
  { id: "bass2-B19", start: 10, end: 14, outcome: "blowoff", caption: "Strong flow: the flame blew off" },
];
const PHASE_MS = 2600;

export function HeroFlame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<FlameScene | null>(null);
  const [act, setAct] = useState(0);
  const [phase, setPhase] = useState<0 | 1>(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvas.current || !document.createElement("canvas").getContext("webgl2")) return;
    let alive = true;
    import("@/components/three/FlameScene").then(({ FlameScene }) => {
      if (!alive || !canvas.current) return;
      const a = ACTS[0], e = getExperiment(a.id)!;
      scene.current = new FlameScene(canvas.current, { view: "duct", gravity: "orbit", o2: e.oxygen_vol_pct!, flow: a.start, outcome: "burning", material: "PMMA" }, { compact: true });
      setReady(true);
    });
    return () => {
      alive = false;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  // cycle: burning at the starting flow, then the recorded outcome, then the next test
  useEffect(() => {
    const t = setTimeout(() => {
      if (phase === 0) setPhase(1);
      else {
        setPhase(0);
        setAct((n) => (n + 1) % ACTS.length);
      }
    }, phase === 0 ? PHASE_MS : PHASE_MS * 1.6);
    return () => clearTimeout(t);
  }, [act, phase]);

  useEffect(() => {
    const a = ACTS[act], e = getExperiment(a.id)!;
    scene.current?.setState({
      view: "duct",
      gravity: "orbit",
      o2: e.oxygen_vol_pct!,
      flow: phase === 0 ? a.start : a.end,
      outcome: phase === 0 ? "burning" : a.outcome,
      material: "PMMA",
    });
  }, [act, phase]);

  const a = ACTS[act], e = getExperiment(a.id)!;
  return (
    <figure className="m-0 relative rounded-2xl overflow-hidden border border-rule-strong bg-panel hero-flame">
      {!ready && <p className="absolute inset-0 grid place-items-center text-muted text-sm animate-pulse">Igniting the 3D wind tunnel…</p>}
      <canvas ref={canvas} className="block w-full h-[380px] sm:h-[460px] cursor-grab active:cursor-grabbing" aria-hidden="true" />
      <figcaption className="absolute left-0 right-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-void via-void/80 to-transparent" aria-live="polite">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="display text-2xl">{e.test_id}</span>
          <span className="text-sm text-muted num">{e.oxygen_vol_pct}% oxygen, same 0.1 mm PMMA film</span>
        </p>
        <p className={`mt-1 font-semibold ${phase === 1 ? (a.outcome === "quench" ? "text-quench" : a.outcome === "blowoff" ? "text-blowoff" : "text-flame") : "text-ink"}`}>
          {phase === 0 ? `Burning at ${a.start} cm/s…` : a.caption}
        </p>
        <p className="mt-1 text-xs text-faint">Illustration driven by NASA&apos;s recorded outcome, not a simulation. Drag to rotate.</p>
      </figcaption>
    </figure>
  );
}
