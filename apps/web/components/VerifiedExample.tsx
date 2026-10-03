import Link from "next/link";
import { experiments, findings, saffireRuns, luciRuns } from "@/lib/data";
import { checkSummary, EXAMPLE_ANSWER, EXAMPLE_PROVENANCE, EXAMPLE_QUESTION, verifiedExample } from "@/lib/ask-example";
import { Cite } from "./Cite";

export function VerifiedExample() {
  const result = verifiedExample(experiments, findings, saffireRuns, luciRuns);
  if (!result.valid) return <section className="verified-example"><h2>Example withheld</h2><p>The saved synthesis no longer passes the current checker.</p></section>;
  return <section className="verified-example" aria-labelledby="example-title">
    <header><p className="text-signal text-xs tracking-widest">VERIFIED EXAMPLE · NO API KEY REQUIRED</p><h2 id="example-title" className="display text-2xl mt-2">{EXAMPLE_QUESTION}</h2><p className="text-xs text-muted mt-3">{EXAMPLE_PROVENANCE}</p></header>
    <div className="verified-example-flow">
      <section><h3>1 · Evidence retrieved first</h3><ul>{["B16","B20","B19"].map(id=><li key={id}><Link className="link" href={`/experiments/bass2-${id}`}>NASA test {id}</Link></li>)}</ul><p className="mt-3 text-sm">NASA airflow findings are retrieved alongside the tests. <Cite sourceId="bass-thickness" page={54}/></p></section>
      <section><h3>2 · Saved AI synthesis</h3><p>{EXAMPLE_ANSWER.summary}</p><p className="text-xs text-muted mt-3">Near-matched runs show an association; they do not isolate airflow as the cause. Fan settings are not calibrated velocities.</p></section>
      <section><h3>3 · Claim check</h3><ul>{checkSummary(result.checked).map(c=><li key={c.label}>{c.pass ? "✓" : "✗"} {c.label}</li>)}</ul><p className="text-xs text-muted mt-3">Deterministic checks passed for this fixture. They do not prove every sentence is scientifically entailed.</p></section>
    </div>
    <details><summary>Read the checked comparison and NASA source</summary><p>{EXAMPLE_ANSWER.claims[1].text}</p><Cite sourceId="bass2-summary" page={111}/><Cite sourceId="bass2-summary" page={112}/></details>
  </section>;
}
