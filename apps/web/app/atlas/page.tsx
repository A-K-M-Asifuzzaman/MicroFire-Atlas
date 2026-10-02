import type { Metadata } from "next";
import { AtlasExplorer } from "@/components/AtlasExplorer";
import { Cite } from "@/components/Cite";
import { RouteStage } from "@/components/world/RouteStage";
import { experiments } from "@/lib/data";

export const metadata: Metadata = { title: "Atlas" };

export default function AtlasPage() {
  return (
    <div className="explorer-page mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <RouteStage kind="atlas" />
      <p className="mt-6 text-sm text-muted max-w-[78ch]">
        {experiments.length} combustion tests aboard the International Space Station, transcribed from NASA&apos;s published test
        tables. Airflow is shown exactly as NASA recorded it: numbers are cm/s, “pot” values are fan settings. Sources:{" "}
        <Cite sourceId="bass2-summary" page={104} where="Table 7.1" />, <Cite sourceId="bass2-summary" page={111} where="Tables A.1–A.2" />.
      </p>
      <div id="atlas-tool" className="scroll-mt-20 mt-8">
        <AtlasExplorer data={experiments} />
      </div>
    </div>
  );
}
