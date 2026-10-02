import Link from "next/link";

export const STATIONS = [
  { href: "/expedition", label: "Adventure", title: "Follow the Spark", detail: "Watch. Measure. Compare. Bring your discoveries to the Moon.", icon: "orbit" },
  { href: "/story", label: "Play", title: "Mission Freefall", detail: "Build a wind tunnel. Make the call. Follow the evidence.", icon: "rocket" },
  { href: "/atlas", label: "Atlas", title: "Test observatory", detail: "Open a real test and discover what the crew recorded.", icon: "orbit" },
  { href: "/analyze", label: "Flame Vision", title: "Observation station", detail: "Watch NASA footage and inspect the flame, frame by frame.", icon: "eye" },
  { href: "/compare", label: "Compare", title: "Comparison bench", detail: "Put tests side by side. Find the condition that changed.", icon: "compare" },
  { href: "/mission", label: "Mission Lab", title: "Mission desk", detail: "Choose cabin conditions and find the closest recorded tests.", icon: "sliders" },
  { href: "/gaps", label: "Evidence gaps", title: "The frontier", detail: "Find the questions this collection cannot answer yet.", icon: "map" },
  { href: "/ask", label: "Ask", title: "Ask the evidence", detail: "Bring a question. Follow the answer back to its NASA sources.", icon: "chat" },
];

const PATHS: Record<string, string> = {
  rocket: "M14 4c3-2 6-2 6-2s0 3-2 6l-7 7-4-4 7-7ZM7 11H3l4-5h5M11 15v4l5-4v-5M5 16l-2 5 5-2M14 7l3 3",
  orbit: "M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM3 17C0 12 15 1 20 5s-9 16-15 15M17 3l1 3 3 1",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z",
  compare: "M4 5h6v14H4zM14 5h6v14h-6M7 9v6M17 9v6",
  sliders: "M5 3v9m0 4v5M12 3v3m0 4v11M19 3v12m0 4v2M2 12h6v4H2zM9 6h6v4H9zM16 15h6v4h-6z",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15",
  chat: "M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM8 9h8M8 13h5",
};

export function StationIcon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name] ?? PATHS.orbit} /></svg>;
}

export function StationMap() {
  return <section className="station-map mx-auto max-w-7xl px-4 sm:px-6 py-16" aria-labelledby="stations-title">
    <div className="station-map-heading"><div><p className="text-signal text-sm">Your next discovery</p><h2 id="stations-title" className="display text-3xl sm:text-4xl mt-2">Where will you go?</h2></div><p className="text-muted max-w-md">Play a mission, explore a real test, or bring your own question. Every room has something to investigate.</p></div>
    <div className="station-destinations">{STATIONS.map((s) => <Link href={s.href} key={s.href} className="station-destination"><span className="station-icon"><StationIcon name={s.icon} /></span><h3 className="display text-xl">{s.title}</h3><p>{s.detail}</p><span className="station-enter">Enter <span aria-hidden="true">↗</span></span></Link>)}</div>
  </section>;
}
