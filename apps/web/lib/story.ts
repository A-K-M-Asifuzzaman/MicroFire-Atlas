/**
 * "Flight Log" story mode: predict what a real NASA test did, then watch the recorded outcome.
 * Every test reference and quote here must exist in the dataset (see story.test.ts).
 */
import type { SceneState } from "@/components/three/FlameScene";

export type Choice = { label: string; correct: boolean };

export type Step = {
  id: string;
  chapter: string;
  title: string;
  body: string;
  /** Who is "speaking": the flight log, NASA's own record, or the atlas. */
  voice: "Flight log" | "NASA record" | "MicroFire Atlas";
  scene: SceneState;
  action?: { kind: "gravity" | "gust"; label: string };
  predict?: {
    question: string;
    choices: Choice[];
    testId: string; // experiment id whose NASA note is revealed
    reveal: string;
    after: Partial<SceneState>;
    finding?: string; // NASA explanation shown with the reveal
  };
  finding?: string; // finding id shown as the evidence for this step
  cite?: { sourceId: string; page?: number; where?: string };
};

const duct = (o2: number, flow: number, outcome: SceneState["outcome"], material: SceneState["material"] = "PMMA"): SceneState => ({
  view: "duct",
  gravity: "orbit",
  o2,
  flow,
  outcome,
  material,
});

export const STEPS: Step[] = [
  {
    id: "earth",
    chapter: "Briefing",
    title: "A flame you know",
    body: "On Earth, hot gas rises and pulls fresh air in from below. That is why a candle flame stands up and flickers.",
    voice: "Flight log",
    scene: { view: "bench", gravity: "earth", o2: 21, flow: 0, outcome: "burning" },
    action: { kind: "gravity", label: "Switch off gravity" },
  },
  {
    id: "orbit",
    chapter: "Briefing",
    title: "Now take gravity away",
    body: "In orbit nothing rises. Without a fan, the flame only gets the oxygen that drifts in. It turns small, round and dim. Everything now depends on the ventilation.",
    voice: "Flight log",
    scene: { view: "bench", gravity: "orbit", o2: 21, flow: 0, outcome: "dim" },
    action: { kind: "gravity", label: "Switch gravity back on" },
    finding: "low-flow-sensitivity",
  },
  {
    id: "duct",
    chapter: "On board the ISS",
    title: "The flight hardware",
    body: "In 2014, astronauts burned small samples inside a glovebox on the space station, in a wind tunnel just 7.6 cm square. For each test they set the oxygen and the fan speed, then lit the sample.",
    voice: "NASA record",
    scene: duct(20.6, 5, "burning"),
    finding: "bass-duct-size",
  },
  {
    id: "b16",
    chapter: "Test B16",
    title: "Thin acrylic, 16.5 % oxygen",
    body: "A 0.1 mm acrylic film burns in a gentle 3 cm/s breeze at reduced oxygen. The crew starts turning the fan down.",
    voice: "Flight log",
    scene: duct(16.5, 3, "burning"),
    predict: {
      question: "What does the flame do as the airflow fades?",
      choices: [
        { label: "Burns hotter, with less wind to cool it", correct: false },
        { label: "Shrinks and goes out", correct: true },
        { label: "Nothing changes", correct: false },
      ],
      testId: "bass2-B16",
      reveal: "As the flow faded, the flame shrank and quenched. NASA's report describes this low-flow regime: spread slows as the flow drops, until the flame goes out.",
      after: { flow: 0.6, outcome: "quench" },
      finding: "radiative-regime",
    },
  },
  {
    id: "b19",
    chapter: "Test B19",
    title: "Same film, same oxygen, more wind",
    body: "Same 0.1 mm film, same 16.4 % oxygen. This time the fan runs at 10 cm/s.",
    voice: "Flight log",
    scene: duct(16.4, 10, "burning"),
    predict: {
      question: "More air means more oxygen. What happens?",
      choices: [
        { label: "It grows into a bigger fire", correct: false },
        { label: "It blows out", correct: true },
        { label: "It keeps burning steadily", correct: false },
      ],
      testId: "bass2-B19",
      reveal: "At high flow, the gas sweeps past too fast for the flame's chemistry to keep up, and the flame blew off.",
      after: { flow: 14, outcome: "blowoff" },
      finding: "blowoff-kinetics",
    },
  },
  {
    id: "b20",
    chapter: "Test B20",
    title: "Somewhere in between",
    body: "Same film, 16.5 % oxygen, with a moderate 5 then 3 cm/s flow.",
    voice: "Flight log",
    scene: duct(16.5, 5, "burning"),
    predict: {
      question: "And this time?",
      choices: [
        { label: "It burns the whole sample", correct: true },
        { label: "It goes out", correct: false },
        { label: "It blows out", correct: false },
      ],
      testId: "bass2-B20",
      reveal: "In the middle of the window, the flame kept going to the end of the sample.",
      after: { outcome: "burning" },
    },
  },
  {
    id: "window",
    chapter: "What the data shows",
    title: "A window, not a rule",
    body: "Every test in the atlas, in 3D. B16, B20 and B19 used the same film at the same oxygen. Too little air starved the flame, too much blew it away. Three runs mark the window but do not measure its edges.",
    voice: "MicroFire Atlas",
    scene: { view: "cloud", gravity: "orbit", o2: 16.5, flow: 5, outcome: "none", highlight: ["bass2-B16", "bass2-B20", "bass2-B19"] },
    finding: "pmma-rod-limits",
  },
  {
    id: "quiet",
    chapter: "The quiet danger",
    title: "A flame you might not see",
    body: "At the lowest flows, NASA saw flames turn dim blue and very stable. They could burn for a long time. The researchers warn that such a flame could flare up if the air suddenly moves.",
    voice: "NASA record",
    scene: duct(20.6, 0.6, "dim"),
    action: { kind: "gust", label: "Gust the fan" },
    finding: "tiny-flame-undetected",
  },
  {
    id: "moon",
    chapter: "Moon and Mars",
    title: "The air future crews will breathe",
    body: "NASA recommends a cabin atmosphere of 34 % oxygen at 56.5 kPa for Moon and Mars missions. That is a lot more oxygen than any test in this atlas.",
    voice: "MicroFire Atlas",
    scene: { view: "cloud", gravity: "orbit", o2: 34, flow: 5, outcome: "none", voidRegion: { y: 2.9, label: "34 % O₂, 56.5 kPa: no tests here" } },
    predict: {
      question: "Based on these 56 tests, how would a fire behave in that air?",
      choices: [
        { label: "It would spread faster", correct: false },
        { label: "It would spread slower", correct: false },
        { label: "These tests can't tell us", correct: true },
      ],
      testId: "",
      reveal: "No test here went above 21 % oxygen or below 99 kPa. Guessing would be extrapolation. The honest answer is that direct evidence is limited, and this is where new experiments are needed.",
      after: {},
    },
    finding: "exploration-atmosphere",
  },
];

export const PREDICTIONS = STEPS.filter((s) => s.predict).length;
