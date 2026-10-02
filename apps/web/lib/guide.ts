/**
 * Ember's floating guide: what Ember says on each page, for 8-13 year-olds (Explorer) and for
 * mentors (Scientist). Each step can point at an element marked data-guide="<target>".
 * Fun facts are kid-friendly rewordings of verified NASA quotes (finding ids are tested).
 */
import type { Mood } from "@/components/game/Ember";

export type GuideStep = { target?: string; kid: string; pro: string; mood?: Mood };
export type GuidePage = { match: (path: string) => boolean; id: string; name: string; steps: GuideStep[] };

export const PAGES: GuidePage[] = [
  {
    id: "home",
    name: "Home",
    match: (p) => p === "/",
    steps: [
      { target: "hero", kid: "Hi, I'm Ember! On Earth, flames like me stand tall because hot air rises. In space nothing rises, so we change shape!", pro: "MicroFire Atlas: 56 BASS/BASS-II tests transcribed from NASA/TM-20210011385, with page-level citations and verified quotes." },
      { target: "hero", kid: "Try the gravity switch next to me, then read the real NASA clue. It comes straight from the astronauts' logbook!", pro: "Hero: gravity teaser (illustration) and test B19's verbatim crew note with its Table A.1 page." },
      { target: "scroll-story", kid: "Scroll down slowly and watch me change from Earth to space. Every result you see really happened on the space station.", pro: "Scroll story: each beat drives the 3D illustration with a recorded outcome (B16 quench, B20 burned, B19 blowoff)." },
      { target: "play", kid: "Want to build a real NASA experiment and light it yourself? Press Start the mission!", pro: "Mission Freefall: guided game built on the same records and verified quotes." },
    ],
  },
  {
    id: "atlas",
    name: "Atlas",
    match: (p) => p === "/atlas",
    steps: [
      { target: "plot", kid: "Each dot is one real fire test astronauts did on the space station. Orange dots kept burning. Blue dots went out.", pro: "Oxygen vs airflow (log) for all tests; colour encodes NASA's recorded outcome, coded from crew notes." },
      { target: "filters", kid: "Slide the Oxygen control and watch which dots disappear. Less oxygen, fewer tests!", pro: "Filters: material, flow direction, outcome group, minimum O₂, quality flags." },
      { target: "table", kid: "Click any test name to read what the astronauts really wrote down.", pro: "Each row links to a test page with per-field provenance (recorded / series / derived)." },
    ],
  },
  {
    id: "analyze",
    name: "Flame Vision",
    match: (p) => p.startsWith("/analyze"),
    steps: [
      { target: "fv-video", kid: "This is a real NASA video of fire in space! Press Play and watch it spread.", pro: "NASA Image and Video Library footage (Saffire / BASS), local web copy with provenance." },
      { target: "fv-modes", kid: "Press AI vision. The computer draws a line around the flame by itself, in every frame!", pro: "Classical OpenCV segmentation: luminous and dim-blue masks inside a documented ROI." },
      { target: "fv-metrics", kid: "Point at a number and I'll light up what it measures on the picture.", pro: "Per-frame pixel-domain metrics; no spatial calibration exists, so nothing is converted to cm." },
      { target: "fv-charts", kid: "These lines show how big the flame was over time. Click a line to jump the video there!", pro: "Area and edge time series; click to seek." },
    ],
  },
  {
    id: "compare",
    name: "Compare",
    match: (p) => p === "/compare",
    steps: [
      { target: "presets", kid: "Pick a comparison. The same material, with only one thing changed: that's a fair test, like at school!", pro: "Curated presets hold conditions constant where the tables allow." },
      { target: "matrix", kid: "The blue words show what is different between the tests.", pro: "Condition matrix: differing values highlighted." },
      { target: "observed", kid: "'Observed' is what NASA saw. 'Interpretation' is our best guess. Real scientists always keep those apart!", pro: "Observed, interpretation and data gaps are separated." },
    ],
  },
  {
    id: "mission",
    name: "Mission Lab",
    match: (p) => p === "/mission",
    steps: [
      { target: "contexts", kid: "Pretend you are designing a space base. Pick where your crew will live.", pro: "Mission contexts set O₂, airflow, pressure and gravity." },
      { target: "sliders", kid: "Move the sliders. I'll find the NASA tests that are most like your cabin.", pro: "Mission Relevance: weighted similarity; missing values count against a test." },
      { target: "notice", kid: "If you go somewhere NASA never tested, I'll tell you honestly: we don't know yet!", pro: "Out-of-domain notice when a value is outside every tested range." },
    ],
  },
  {
    id: "gaps",
    name: "Evidence gaps",
    match: (p) => p === "/gaps",
    steps: [
      { target: "grid", kid: "Each box counts tests. Empty boxes mean nobody has tested there yet. That's a job for future scientists, maybe you!", pro: "O₂ × airflow bins: observed (3+), sparse (1-2), outside evidence (0)." },
      { target: "grid", kid: "The orange rows have more oxygen than the air on Earth. Moon bases might use air like that, and no test here went there.", pro: "No test above 21 % O₂; NASA's recommended exploration atmosphere is 34 % O₂ at 56.5 kPa." },
    ],
  },
  {
    id: "ask",
    name: "Ask",
    match: (p) => p === "/ask",
    steps: [
      { target: "ask-box", kid: "Ask me anything about these fire tests! I only answer with real NASA evidence, and I show where it came from.", pro: "Deterministic retrieval, then a citation-checked model answer; evidence-only fallback without a key." },
      { target: "evidence", kid: "This list is the evidence I'm allowed to use. If something isn't in here, I won't make it up.", pro: "Only items in this package can be cited; unknown citations are removed and unsupported numbers flagged." },
    ],
  },
  {
    id: "experiment",
    name: "Test page",
    match: (p) => p.startsWith("/experiments/"),
    steps: [
      { target: "notes", kid: "This is one real test. Read what the crew and ground team wrote, word for word.", pro: "Verbatim observations column from NASA's table." },
      { target: "conditions", kid: "Each number says where it came from: from this test, from NASA's whole set, or worked out by us.", pro: "Per-field basis: recorded, series, derived, not stated." },
      { target: "confidence", kid: "This checklist shows how sure we can be about this test. More ticks, more sure.", pro: "Evidence Confidence: equal-weight checklist, a project heuristic." },
    ],
  },
  {
    id: "methodology",
    name: "How it works",
    match: (p) => p === "/methodology",
    steps: [{ kid: "This page is for grown-up scientists. It shows every rule we used. Scientists call that showing your work!", pro: "Formulas, weights, scales, outcome codes and limitations rendered from the code." }],
  },
  {
    id: "sources",
    name: "Sources",
    match: (p) => p === "/sources",
    steps: [{ kid: "These are the real NASA reports everything on this website comes from.", pro: "NTRS records with copyright determination and SHA-256 hashes." }],
  },
];

export const guideFor = (path: string) => PAGES.find((p) => p.match(path));

/** Kid-friendly fun facts; each rewords a verified finding (see guide.test.ts). */
export const FUN_FACTS: { finding: string; text: string }[] = [
  { finding: "dim-blue-low-flow", text: "With almost no breeze, space flames turn dim blue and very steady, and they can keep burning for a long time." },
  { finding: "tiny-flame-undetected", text: "Scientists worry that a tiny space flame could hide unnoticed, then flare up if the air suddenly moves." },
  { finding: "low-flow-sensitivity", text: "Space flames are super sensitive to tiny breezes: between 0 and 5 centimetres per second, everything changes." },
  { finding: "bass-duct-size", text: "The wind tunnel astronauts used was only 7.6 cm wide and 17 cm long. You could hold it in your hands!" },
  { finding: "low-g-burns-lower-o2", text: "Some materials burned with less oxygen in low gravity than they needed on Earth." },
  { finding: "luci-first-lunar", text: "NASA spun a rocket to make pretend Moon gravity and ran the first fire tests there that lasted longer than 25 seconds!" },
  { finding: "luci-fm2", text: "NASA plans to burn materials on the real Moon in an experiment called FM2." },
  { finding: "saffire-vs-bass", text: "Big Saffire fires in a big tunnel spread slower than small BASS fires in a small tunnel. The space around a fire matters!" },
  { finding: "hw-igniter", text: "Astronauts lit each sample with a glowing coil of wire, pulled into place by hand." },
];

/**
 * Discoveries: the only thing that earns an Explorer star. Each is a learning action
 * (not a page visit) and each node in the evidence constellation opens a real place.
 * The list order is the journey (Act I: Mission Freefall, Act II: the Evidence Expedition);
 * stars are placed around a teardrop so the finished constellation is a flame.
 */
export type Discovery = { id: string; label: string; href: string; x: number; y: number; kind: "act" | "record" | "gap" | "source" };
const JOURNEY: Omit<Discovery, "x" | "y">[] = [
  { id: "gravity", label: "Saw a flame change without gravity", href: "/story", kind: "act" },
  { id: "built", label: "Built NASA's BASS-II wind tunnel", href: "/story", kind: "act" },
  { id: "fixed", label: "Fixed the setup before the test", href: "/story", kind: "act" },
  { id: "b20", label: "Lit a sample at test B20's real settings", href: "/experiments/bass2-B20", kind: "record" },
  { id: "b16", label: "Watched how test B16 ended", href: "/experiments/bass2-B16", kind: "record" },
  { id: "b19", label: "Watched how test B19 ended", href: "/experiments/bass2-B19", kind: "record" },
  { id: "fabric", label: "Lined up the fabric quench records", href: "/atlas", kind: "record" },
  { id: "clue", label: "Pinned a real crew-log clue", href: "/story", kind: "record" },
  { id: "quiet", label: "Found the hidden dim flame", href: "/story", kind: "act" },
  { id: "realflame", label: "Picked a real NASA flame video", href: "/expedition", kind: "record" },
  { id: "aivision", label: "Used AI Vision to measure a real flame", href: "/analyze", kind: "act" },
  { id: "hop", label: "Changed one thing between two real tests", href: "/expedition", kind: "record" },
  { id: "difference", label: "Spotted the difference NASA recorded", href: "/compare", kind: "record" },
  { id: "moonmatch", label: "Found the closest evidence for a Moon habitat", href: "/mission", kind: "act" },
  { id: "edge", label: "Found where the evidence stops", href: "/gaps", kind: "gap" },
  { id: "askpix", label: "Asked PIX a question with sources", href: "/ask", kind: "act" },
  { id: "source", label: "Opened a real NASA report page", href: "/sources", kind: "source" },
];
/** Teardrop: x = sin θ · sin(θ/2), y = cos θ, tip at the top; the journey starts at the bottom. */
export const DISCOVERIES: Discovery[] = JOURNEY.map((d, i) => {
  const t = Math.PI + (2 * Math.PI * (i + 0.5)) / JOURNEY.length; // half-step offset: one star sits on the tip
  return { ...d, x: +(50 + 40 * Math.sin(t) * Math.abs(Math.sin(t / 2))).toFixed(2), y: +(52 - 46 * Math.cos(t)).toFixed(2) };
});
export const discovery = (id: string) => DISCOVERIES.find((d) => d.id === id);

/**
 * The guide crew: original illustrated characters who each show children one kind of thing.
 * Ember hosts tours and fun facts; a crew member gives each page's one-line goal.
 */
export type CrewId = "tala" | "kofi" | "mei";
export const CREW: Record<CrewId, { name: string; job: string; img: string }> = {
  tala: { name: "Tala", job: "Navigator: where to go next", img: "/art/tala.webp" },
  kofi: { name: "Kofi", job: "Lab engineer: how to play", img: "/art/kofi.webp" },
  mei: { name: "Dr. Mei", job: "Scientist: how to read the evidence", img: "/art/mei.webp" },
};

/** "What am I looking for?": one short goal per page, in Explorer and Scientist words. */
export const GOALS: Record<string, { crew: CrewId; kid: string; pro: string; next?: { label: string; href: string } }> = {
  home: { crew: "tala", kid: "Flip the gravity switch, read the real NASA clue, then press Start the mission. Scroll down to see fire change in space!", pro: "Hero teaser, one verbatim crew note, then the scroll story and evidence map.", next: { label: "Start the mission", href: "/story" } },
  atlas: { crew: "mei", kid: "Every dot is a real fire test from the space station. Tap a dot, then read what the astronauts wrote.", pro: "All 56 records by O₂ and airflow; select a point for its full provenance.", next: { label: "Compare two tests", href: "/compare" } },
  analyze: { crew: "kofi", kid: "Play the real NASA video, then press AI vision to see the computer find the flame.", pro: "Classical CV on NASA footage; pixel units only.", next: { label: "Explore the tests", href: "/atlas" } },
  compare: { crew: "mei", kid: "Two tests, one difference. Guess what changed the flame, then read what NASA saw.", pro: "Controlled presets: observed, interpretation and gaps kept apart.", next: { label: "Find the evidence gaps", href: "/gaps" } },
  mission: { crew: "kofi", kid: "Pick a place for a space crew to live. We'll find the closest real tests, and show what's missing.", pro: "Evidence proximity with a separate coverage figure; not a risk score.", next: { label: "See the gaps", href: "/gaps" } },
  gaps: { crew: "tala", kid: "Empty squares are places no test has been. Finding them is a real discovery!", pro: "O₂ × airflow coverage; empty cells make no claim.", next: { label: "Ask a question", href: "/ask" } },
  ask: { crew: "mei", kid: "Ask a short question. Every answer shows the NASA evidence it came from, or says we don't know.", pro: "Deterministic retrieval, then a cited answer with claim checks.", next: { label: "Back to the mission", href: "/story" } },
  experiment: { crew: "mei", kid: "This is one real test. Each number says if NASA wrote it down (recorded) or we worked it out (derived).", pro: "Per-field provenance: recorded, series, derived, not stated.", next: { label: "Compare it", href: "/compare" } },
  methodology: { crew: "mei", kid: "This is how we checked every number. Scientists call it showing your work!", pro: "Formulas, weights and limits, rendered from code.", next: { label: "See the sources", href: "/sources" } },
  sources: { crew: "mei", kid: "These are the real NASA reports. Open one to see where a clue came from.", pro: "NTRS records with hashes.", next: { label: "Back to the mission", href: "/story" } },
};
