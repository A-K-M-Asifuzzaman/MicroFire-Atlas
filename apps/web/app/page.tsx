import Link from "next/link";
import { FlowO2Plot } from "@/components/FlowO2Plot";
import { SparkJourney } from "@/components/world/CinematicWorld";
import { RealFlameReveal } from "@/components/world/RealFlameReveal";
import { HomePaths } from "@/components/HomePaths";
import { HowItThinks, WhyItMatters } from "@/components/HowItThinks";
import { Legend } from "@/components/Outcome";
import { Cite, Quote } from "@/components/Cite";
import { experiments, findings } from "@/lib/data";

const FATES = ["bass2-B16", "bass2-B20", "bass2-B19"];
const WHY = ["low-flow-sensitivity", "dim-blue-low-flow", "tiny-flame-undetected", "low-g-burns-lower-o2"];

export default function Home() {
  const why = WHY.map((id) => findings.find((f) => f.id === id)!);

  return (
    <>
      <SparkJourney />
      <HomePaths />
      <HowItThinks />
      <RealFlameReveal />

      <section className="border-b border-rule">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center">
          <div>
            <h2 className="display text-2xl sm:text-3xl">BASS tests on one map</h2>
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
              label="BASS tests plotted by oxygen and airflow. Tests B16, B20 and B19 are highlighted."
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

      <WhyItMatters />

      <section className="home-thesis" aria-labelledby="thesis">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 text-center">
          <p className="text-signal text-sm">Where the evidence stops</p>
          <h2 id="thesis" className="display text-4xl sm:text-5xl mt-3">Good science does not hide what it doesn&apos;t know.</h2>
          <p className="mt-5 text-lg text-muted max-w-[62ch] mx-auto">
            Only two test rows in this atlas burned in lunar gravity, both simulated on a spinning rocket. No test reached the 34 % oxygen of
            NASA&apos;s exploration atmosphere A, and burns on the Moon itself have not happened yet. MicroFire Atlas shows that gap instead of guessing across it. <Cite sourceId="luci" />
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/mission?context=moon-base" className="story-cta">Explore the evidence</Link>
            <Link href="/gaps" className="border border-rule-strong px-5 py-3 rounded-sm hover:border-signal">See the Research Frontier</Link>
          </div>
        </div>
      </section>
    </>
  );
}
