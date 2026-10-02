import Link from "next/link";
import { FlowO2Plot } from "@/components/FlowO2Plot";
import { ScrollStory } from "@/components/ScrollStory";
import { EvidenceConstellation } from "@/components/world/EvidenceConstellation";
import { GravityTeaser } from "@/components/world/GravityTeaser";
import { SparkJourney } from "@/components/world/CinematicWorld";
import { StationMap } from "@/components/StationMap";
import { Legend } from "@/components/Outcome";
import { Cite, Quote } from "@/components/Cite";
import { experiments, findings, sources } from "@/lib/data";

const FATES = ["bass2-B16", "bass2-B20", "bass2-B19"];
const WHY = ["low-flow-sensitivity", "dim-blue-low-flow", "tiny-flame-undetected", "low-g-burns-lower-o2"];

const STEPS = [
  {
    title: "Read NASA's own test tables",
    body: "Each record is typed from a published NASA test matrix, with the original units and the crew's notes kept word for word.",
  },
  {
    title: "Check every number and quote",
    body: "Units are converted by tested code. Every quoted finding is matched against the source text at build time and fails the build if it isn't there.",
  },
  {
    title: "Rank tests against your scenario",
    body: "Mission Lab scores how close each test is to the oxygen, airflow and material you describe, and shows the arithmetic.",
  },
  {
    title: "Interpret with citations",
    body: "Summaries quote NASA findings and link to the PDF page. Where no test covers your conditions, the site says so.",
  },
];

export default function Home() {
  const why = WHY.map((id) => findings.find((f) => f.id === id)!);
  const materials = new Set(experiments.map((e) => e.material)).size;

  return (
    <>
      <SparkJourney />
      <section className="home-gravity mx-auto max-w-7xl px-5 py-16 grid gap-8 lg:grid-cols-2 items-center">
        <div><p className="text-signal">Your first mystery</p><h2 className="display text-4xl mt-3">What happens when<br />gravity changes?</h2><p className="text-muted mt-5 max-w-md">Try the switch. This illustration helps you imagine a change; real flames depend on their fuel, airflow, and surroundings too.</p><Link href="/story" className="story-cta inline-flex mt-7">Build the 3D experiment</Link></div>
        <GravityTeaser />
      </section>

      <StationMap />
      <section className="border-y border-rule bg-panel/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center">
          <div>
            <h2 className="display text-2xl sm:text-3xl">Your evidence map</h2>
            <p className="mt-3 text-muted max-w-[44ch]">
              Every star is something you can do or a real NASA record. Stars light up when you discover them, and any
              star takes you there.
            </p>
          </div>
          <EvidenceConstellation />
        </div>
      </section>

      <div data-guide="scroll-story" id="scroll-story">
        <ScrollStory />
      </div>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center">
          <div>
            <h2 className="display text-2xl sm:text-3xl">Every test on one map</h2>
            <p className="mt-3 text-muted">
              Each dot is a real test aboard the ISS, placed by its oxygen level and airflow and coloured by what NASA
              recorded. Select any dot to open its record.
            </p>
            <p className="mt-4 text-sm text-muted">
              Highlighted: the same 2-cm-wide, 0.1-mm PMMA film at about 16.5 % oxygen. The main difference between the runs
              was airflow, and the outcome changed three ways. <Cite sourceId="bass2-summary" page={111} where="Table A.1 (B16)" />,{" "}
              <Cite sourceId="bass2-summary" page={112} where="Table A.1 (B20, B19)" />
            </p>
          </div>
          <div className="bg-panel border border-rule rounded-sm p-3 sm:p-5">
            <FlowO2Plot
              data={experiments}
              highlight={FATES}
              label="Every NASA test in the atlas, plotted by oxygen and airflow. Tests B16, B20 and B19 are highlighted."
            />
            <Legend className="mt-3 px-1" />
          </div>
        </div>
      </section>

      <section className="border-y border-rule bg-panel">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <h2 className="display text-2xl sm:text-3xl">What NASA found about fire without gravity</h2>
          <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {why.map((f) => (
              <Quote key={f.id} f={f} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div>
          <h2 className="display text-2xl sm:text-3xl">How the atlas works</h2>
          <p className="mt-4 text-muted">
            {experiments.length} test records across {materials} materials, drawn from {sources.length} NASA documents, with{" "}
            {findings.length} quoted findings checked against the original text.
          </p>
        </div>
        <ol className="grid gap-8 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-rule-strong pt-4">
              <span className="text-sm text-faint num">Step {i + 1}</span>
              <h3 className="mt-1 font-semibold text-lg">{s.title}</h3>
              <p className="mt-2 text-muted text-[15px]">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="border border-rule-strong rounded-sm p-8 sm:p-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="display text-2xl">Moon and Mars are where the evidence thins out</h2>
            <p className="mt-3 text-muted max-w-[70ch]">
              Every test in this atlas was run in orbit. Partial-gravity data exists but is scarce: NASA describes its LUCI
              sounding-rocket experiment as the first combustion tests longer than 25 seconds in simulated lunar gravity.{" "}
              <Cite sourceId="luci" />
            </p>
          </div>
          <Link href="/gaps" className="border border-rule-strong px-5 py-3 rounded-sm hover:border-signal whitespace-nowrap">
            See the evidence gaps
          </Link>
        </div>
      </section>
    </>
  );
}
