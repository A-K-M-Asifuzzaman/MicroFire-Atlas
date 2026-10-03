import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runEval, runFindingEval } from "./eval.ts";

const read = (f: string) => JSON.parse(readFileSync(new URL(f, import.meta.url), "utf8"));
const r = runEval(read("../eval/microfire-eval-v1.json").questions, read("../data/experiments.json"), read("../data/findings.json"), read("../data/saffire.json"), read("../data/luci.json"));

// floors, not targets: a change that lowers any of these fails the build
test("MicroFire-Eval v1 floors", () => {
  assert.equal(r.questions, 100);
  assert.ok(r.passed >= 98, `passed ${r.passed}/100`);
  assert.ok(r.recallAll >= 0.97, `recall ${r.recallAll}`);
  assert.equal(r.overClaims, 0); // no unanswerable or gap question ever comes back with direct evidence
  assert.equal(r.abstention.correct, r.abstention.n);
  assert.equal(r.verifier.caught, r.verifier.faulty);
  assert.equal(r.verifier.falseAlarms, 0);
});

test("finding evaluation preserves source roles, regime separation and six adversarial gaps",()=>{
 const labels=read("../eval/finding-labels-v1.json").cases;
 const findings=read("../data/findings.json");
 for(const c of labels)for(const id of c.gold)assert.ok(findings.some((f:{id:string})=>f.id===id),id);
 const f=runFindingEval(labels,read("../data/experiments.json"),findings,read("../data/saffire.json"),read("../data/luci.json"));
 assert.equal(f.labelled,7);assert.equal(f.abstention.n,6);assert.equal(f.abstention.correct,6);
 assert.equal(f.wrongRegimePromotions,0);assert.equal(f.sourceRoles.correct,f.sourceRoles.n);
 assert.equal(f.unsupportedMissionImplicationRate,0);assert.equal(f.adversarialImplications.rejected,f.adversarialImplications.n);
 assert.ok(f.recall3!==null&&f.recall5!==null&&f.mrr!==null&&f.recall3<=f.recall5);
});
