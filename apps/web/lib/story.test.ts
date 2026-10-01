import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STEPS } from "./story.ts";

const read = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url), "utf8"));
const exps = new Map(read("experiments").map((e: { id: string }) => [e.id, e]));
const finds = new Set(read("findings").map((f: { id: string }) => f.id));

test("story references only real tests and verified findings", () => {
  for (const s of STEPS) {
    if (s.finding) assert.ok(finds.has(s.finding), `${s.id}: ${s.finding}`);
    if (s.predict?.finding) assert.ok(finds.has(s.predict.finding), `${s.id}: ${s.predict.finding}`);
    if (s.predict?.testId) assert.ok(exps.has(s.predict.testId), `${s.id}: ${s.predict.testId}`);
    for (const id of s.scene.highlight ?? []) assert.ok(exps.has(id), `${s.id}: ${id}`);
    if (s.predict) assert.equal(s.predict.choices.filter((c) => c.correct).length, 1, `${s.id}: exactly one correct choice`);
  }
});

test("predicted outcomes match NASA's recorded outcomes", () => {
  const want: Record<string, string> = { "bass2-B16": "quenched_low_flow", "bass2-B19": "blowoff", "bass2-B20": "burned_entire_sample" };
  for (const [id, outcome] of Object.entries(want)) assert.equal((exps.get(id) as { outcome: string }).outcome, outcome);
  const o2 = (id: string) => (exps.get(id) as { oxygen_vol_pct: number }).oxygen_vol_pct;
  assert.deepEqual([o2("bass2-B16"), o2("bass2-B19"), o2("bass2-B20")], [16.5, 16.4, 16.5]);
});

test("the Moon step's premise holds: nothing above 21.5 % oxygen in the atlas", () => {
  const max = Math.max(...[...exps.values()].map((e) => (e as { oxygen_vol_pct: number }).oxygen_vol_pct ?? 0));
  assert.ok(max <= 21.5, String(max));
});
