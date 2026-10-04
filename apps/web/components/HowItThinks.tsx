import Link from "next/link";
import { evidenceRecords, findings, sources } from "@/lib/data";
import styles from "./HowItThinks.module.css";

/** The homepage answer to "why is this an AI system?": what each stage does, and where to see it working. */
export function HowItThinks() {
  const stages = [
    { name: "NASA evidence", body: `${evidenceRecords.length} test records, ${findings.length} quoted findings, ${sources.length} NASA documents`, href: "/sources" },
    { name: "Structured retrieval", body: "Searches typed records and checked quotes, never the open web", href: "/methodology#data" },
    { name: "Evidence ranking", body: "Direct, analogous or mechanistic, with a stability check on every rank", href: "/methodology#ladder" },
    { name: "AI synthesis", body: "A language model explains only the evidence it was handed", href: "/challenge#stage-6" },
    { name: "Claim verification", body: "Citations, numbers, units and causal wording checked after generation", href: "/methodology#ai" },
    { name: "Mission interpretation", body: "Your cabin conditions against the closest NASA tests", href: "/mission" },
    { name: "Uncertainty and abstention", body: "Outside the evidence, the system says so and gives no number", href: "/model-lab" },
    { name: "Research gap", body: "The untested condition, written as the next research question", href: "/gaps" },
  ];
  const abilities = [
    { name: "Evidence retrieval", body: "Find relevant NASA tests across BASS-II, Saffire and LUCI in one search.", href: "/ask", cta: "Ask a question" },
    { name: "AI synthesis", body: "Explain retrieved evidence in plain language. Live synthesis is paused on the public site; a saved answer is re-verified on every build.", href: "/challenge#stage-6", cta: "See a verified answer" },
    { name: "Claim verification", body: "Every generated claim must cite retrieved evidence and keep its numbers, units and gravity context.", href: "/methodology#evaluate", cta: "Try to fool the checker" },
    { name: "Evidence-bounded ML", body: "A validated model on 41 BASS-II tests that refuses to predict outside the conditions NASA tested.", href: "/model-lab", cta: "Open the Model Lab" },
  ];
  return (
    <section className={styles.wrap} aria-labelledby="thinks-title">
      <div className={styles.inner}>
        <h2 id="thinks-title" className={styles.title}>How MicroFire thinks</h2>
        <p className={styles.lede}>From a NASA test table to a bounded answer. AI is used where it helps, and stopped where the evidence stops.</p>
        <ol className={styles.flow}>
          {stages.map((s, i) => (
            <li key={s.name} data-stop={i >= 6 || undefined}>
              <Link href={s.href}>
                <span className={styles.n}>{String(i + 1).padStart(2, "0")}</span>
                <strong>{s.name}</strong>
                <span>{s.body}</span>
              </Link>
            </li>
          ))}
        </ol>
        <ul className={styles.abilities}>
          {abilities.map((a) => (
            <li key={a.name}>
              <h3>{a.name}</h3>
              <p>{a.body}</p>
              <Link href={a.href} className="link">{a.cta}</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** What a researcher can do here that a pile of PDFs does not allow. No invented time savings. */
export function WhyItMatters() {
  const verbs = [
    ["Find", "relevant experiments across three NASA test families", "/atlas"],
    ["Compare", "conditions on the same dimensions and units", "/compare"],
    ["Trace", "every result to its report, table and page", "/sources"],
    ["Interpret", "evidence without hiding its uncertainty", "/mission"],
    ["Identify", "conditions NASA has not tested yet", "/gaps"],
    ["Plan", "which research question would add the most coverage", "/gaps#evidence-gain"],
  ];
  return (
    <section className={styles.why} aria-labelledby="why-title">
      <div className={styles.inner}>
        <h2 id="why-title" className={styles.title}>Why this matters</h2>
        <p className={styles.lede}>Decades of NASA fire research sit in separate reports, tables and slide decks. MicroFire lets a researcher:</p>
        <ul className={styles.verbs}>
          {verbs.map(([v, t, href]) => (
            <li key={v}><Link href={href}><b>{v}</b> {t}</Link></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
