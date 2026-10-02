"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FlowO2Plot } from "@/components/FlowO2Plot";
import { Legend, OutcomeTag } from "@/components/Outcome";
import { GROUP_LABEL } from "@/lib/data";
import type { Experiment, OutcomeGroup } from "@/lib/types";

type SortKey = "test_id" | "oxygen_vol_pct" | "flow_initial_cm_s" | "thickness_mm" | "outcome_label";

export function AtlasExplorer({ data }: { data: Experiment[] }) {
  const materials = [...new Set(data.map((e) => e.material))];
  const [material, setMaterial] = useState("all");
  const [direction, setDirection] = useState("all");
  const [groups, setGroups] = useState<Set<OutcomeGroup>>(new Set(["sustained", "extinguished", "not_ignited", "unknown"]));
  const [o2Min, setO2Min] = useState(13);
  const [hideFlagged, setHideFlagged] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "oxygen_vol_pct", dir: -1 });

  const rows = useMemo(() => {
    const out = data.filter(
      (e) =>
        (material === "all" || e.material === material) &&
        (direction === "all" || e.flow_direction === direction) &&
        groups.has(e.outcome_group) &&
        (e.oxygen_vol_pct ?? 0) >= o2Min &&
        (!hideFlagged || e.quality_flags.length === 0),
    );
    return out.sort((a, b) => {
      const av = a[sort.key] ?? -Infinity;
      const bv = b[sort.key] ?? -Infinity;
      return (av < bv ? -1 : av > bv ? 1 : a.id.localeCompare(b.id)) * sort.dir;
    });
  }, [data, material, direction, groups, o2Min, hideFlagged, sort]);

  const toggleGroup = (g: OutcomeGroup) =>
    setGroups((s) => {
      const n = new Set(s);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });
  const resetFilters = () => {
    setMaterial("all"); setDirection("all"); setO2Min(13); setHideFlagged(false);
    setGroups(new Set(["sustained", "extinguished", "not_ignited", "unknown"]));
  };

  const th = (key: SortKey, label: string, align = "text-left") => (
    <th scope="col" className={`py-2 pr-4 font-medium ${align}`} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button className="hover:text-ink" onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : 1 }))}>
        {label}
        {sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
      </button>
    </th>
  );

  return (
    <div className="atlas-workspace grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside data-guide="filters" aria-label="Filters" className="control-desk space-y-6 text-sm lg:sticky lg:top-20 lg:self-start">
        <div className="desk-heading"><h2 className="display text-xl">Choose your clues</h2><button onClick={resetFilters} className="text-sm link">Reset</button></div>
        <label className="block">
          <span className="text-muted">Material</span>
          <select value={material} onChange={(e) => setMaterial(e.target.value)} className="mt-1 w-full bg-panel border border-rule rounded-sm px-2 py-2">
            <option value="all">All materials</option>
            {materials.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-muted">Flow direction</span>
          <select value={direction} onChange={(e) => setDirection(e.target.value)} className="mt-1 w-full bg-panel border border-rule rounded-sm px-2 py-2">
            <option value="all">Opposed and concurrent</option>
            <option value="opposed">Opposed (flow against the spreading flame)</option>
            <option value="concurrent">Concurrent (flow with the spreading flame)</option>
          </select>
        </label>
        <fieldset>
          <legend className="text-muted">Outcome</legend>
          {(Object.keys(GROUP_LABEL) as OutcomeGroup[]).map((g) => (
            <label key={g} className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={groups.has(g)} onChange={() => toggleGroup(g)} className="accent-[var(--signal)]" />
              {GROUP_LABEL[g]}
            </label>
          ))}
        </fieldset>
        <label className="block">
          <span className="text-muted">
            Oxygen at least <span className="text-ink num">{o2Min}%</span>
          </span>
          <input type="range" min={13} max={21} step={0.5} value={o2Min} onChange={(e) => setO2Min(Number(e.target.value))} className="mt-2 w-full accent-[var(--signal)]" />
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={hideFlagged} onChange={(e) => setHideFlagged(e.target.checked)} className="mt-1 accent-[var(--signal)]" />
          <span>Hide tests NASA or we flagged (suspect O₂ reading, reused sample)</span>
        </label>
      </aside>

      <div className="min-w-0">
        <div data-guide="plot" className="instrument-panel p-3 sm:p-5">
          <div className="instrument-heading"><div><h2 className="display text-2xl">The test map</h2><p>Choose a point to open its NASA record.</p></div><span className="instrument-count">{rows.length} tests</span></div>
          <FlowO2Plot data={rows} height={360} label={`${rows.length} filtered NASA tests, plotted by oxygen and airflow`} />
          <Legend className="mt-3 px-1" />
        </div>
        <div className="results-toolbar"><div><h2 className="display text-2xl">Open a test record</h2><p className="text-sm text-muted" aria-live="polite">Showing {rows.length} of {data.length} tests</p></div><div className="view-switch" role="group" aria-label="Test display"><button aria-pressed={view === "cards"} onClick={() => setView("cards")}>Cards</button><button aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button></div></div>
        {view === "cards" && <div className="test-card-grid">{rows.map((e) => <Link href={`/experiments/${e.id}`} key={e.id} className="test-record-card">
          <div className="test-card-title"><span className="display">{e.test_id}</span><span>{e.investigation}</span></div>
          <p className="test-material">{e.material}{e.thickness_mm != null ? ` · ${e.thickness_mm} mm` : ""}</p>
          <dl><div><dt>Oxygen</dt><dd>{e.oxygen_vol_pct ?? "—"}<small> %</small></dd></div><div><dt>Starting airflow</dt><dd>{e.flow_initial_cm_s ?? "—"}<small> cm/s</small></dd></div></dl>
          <div className="test-card-outcome"><OutcomeTag outcome={e.outcome} label={e.outcome_label} /></div>
          <span className="test-card-open">Read the crew’s record <span aria-hidden="true">↗</span></span>
        </Link>)}</div>}
        <div data-guide="table" hidden={view !== "table"} className="data-table mt-2 overflow-x-auto">
          <table className="w-full text-sm condensed num">
            <caption className="sr-only">NASA microgravity combustion tests</caption>
            <thead className="text-muted border-b border-rule-strong">
              <tr>
                {th("test_id", "Test")}
                <th scope="col" className="py-2 pr-4 font-medium text-left">Material</th>
                {th("thickness_mm", "Thickness")}
                <th scope="col" className="py-2 pr-4 font-medium text-left">Flow</th>
                {th("flow_initial_cm_s", "Airflow, cm/s")}
                {th("oxygen_vol_pct", "O₂ %")}
                {th("outcome_label", "Outcome")}
                <th scope="col" className="py-2 font-medium text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-rule hover:bg-panel">
                  <td className="py-2.5 pr-4">
                    <Link href={`/experiments/${e.id}`} className="link">
                      {e.test_id}
                    </Link>
                    <span className="block text-faint">{e.investigation}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    {e.material}
                    {e.width_mm != null && <span className="block text-faint">{e.width_mm / 10} cm wide</span>}
                  </td>
                  <td className="py-2.5 pr-4">{e.thickness_mm != null ? `${e.thickness_mm} mm` : <span className="text-faint">not stated</span>}</td>
                  <td className="py-2.5 pr-4">{e.flow_direction}</td>
                  <td className="py-2.5 pr-4">{e.flow_verbatim}</td>
                  <td className="py-2.5 pr-4">
                    {e.oxygen_vol_pct}
                    {e.quality_flags.includes("o2_reading_suspect") && (
                      <span className="text-flame" title="NASA marks this oxygen reading as possibly inaccurate">
                        {" "}
                        ?
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <OutcomeTag outcome={e.outcome} label={e.outcome_label} />
                  </td>
                  <td className="py-2.5 text-muted">{e.provenance.record.table}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="empty-discovery"><span aria-hidden="true">◎</span><h3 className="display text-2xl">No tests in this corner.</h3><p>Try a wider oxygen range or include more outcomes.</p><button className="story-action" onClick={resetFilters}>Show all tests</button></div>}
      </div>
    </div>
  );
}
