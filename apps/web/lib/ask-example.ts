import { buildEvidence, checkAnswer, type RawAnswer } from "./ask-core.ts";
import type { Experiment, Finding, SaffireRun, LuciRun } from "./types";

export const EXAMPLE_QUESTION = "What happens to a PMMA flame when airflow changes in microgravity?";
export const EXAMPLE_PROVENANCE = "Saved OpenAI synthesis: MicroFire-Eval q036, 2026-10-03. The displayed summary is preserved from that run and rechecked as a cited claim. Not a live request.";
// Checked static fixture: the saved q036 summary and its derived comparison, not an unverified live response.
export const EXAMPLE_ANSWER: RawAnswer = {
  summary: "All three BASS-II runs used 2-cm, 100-µm-thick PMMA in opposed flow at about 16.4–16.5% O2 aboard the ISS. Outcomes differed: B16 quenched, B20 burned the entire sample, and B19 blew off; the reported fan “pot” settings were different across runs.",
  claims: [
    { type: "OBSERVED", text: "All three BASS-II runs used 2-cm, 100-µm-thick PMMA in opposed flow at about 16.4–16.5% O2 aboard the ISS. Outcomes differed: B16 quenched, B20 burned the entire sample, and B19 blew off; the reported fan “pot” settings were different across runs.", cites: ["E:bass2-B16", "E:bass2-B20", "E:bass2-B19"] },
    { type: "DERIVED", text: "The three tests used the same material dimensions and nearly identical oxygen levels (16.4–16.5 % O2).", cites: ["E:bass2-B16", "E:bass2-B19", "E:bass2-B20"] },
  ],
};
export function verifiedExample(exps: Experiment[], finds: Finding[], saffire: SaffireRun[], luci: LuciRun[]) {
  const evidence = buildEvidence(`${EXAMPLE_QUESTION} Compare B16, B20 and B19.`, exps, finds, saffire, luci);
  const checked = checkAnswer(EXAMPLE_ANSWER, evidence.items, EXAMPLE_QUESTION);
  return { evidence, checked, valid: checked.length > 0 && checked.every(c => c.verified) };
}
