/**
 * Records the real site, scene by scene, with Chrome's screencast (crisp JPEG frames + timestamps).
 * Every action is timed to the narration in build/timed.json, so the clicks land on the spoken line.
 * Vox-style key-phrase captions are drawn as an overlay during capture (bypassCSP is a recording-only setting).
 *
 *   SITE=http://localhost:3417 node capture.mjs [sceneId]
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";

const SITE = process.env.SITE ?? "http://localhost:3417";
const timed = JSON.parse(readFileSync("build/timed.json", "utf8"));
const only = process.argv[2];
const W = 1920, H = 1080;

const OVERLAY = readFileSync(new URL("./overlay.js", import.meta.url), "utf8");

// A real window on the GPU: headless software rendering only reaches ~9 fps at 1080p.
const b = await chromium.launch({ headless: process.env.HEADED ? false : true, channel: process.env.HEADED ? undefined : "chromium", args: ["--window-position=0,0", "--window-size=1920,1080", "--use-angle=metal", "--enable-gpu", "--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, bypassCSP: true });
await ctx.addInitScript(OVERLAY);
const p = await ctx.newPage();
await ctx.addInitScript(() => {
  try {
    const k = "microfire-explorer-v2", s = JSON.parse(localStorage.getItem(k) || "{}");
    s.tips = ["home", "story", "atlas", "analyze", "compare", "mission", "gaps", "ask", "methodology", "sources", "experiment", "expedition"];
    localStorage.setItem(k, JSON.stringify(s));
  } catch {}
});
p.setDefaultTimeout(6000);
const cdp = await ctx.newCDPSession(p);
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const go = async (path) => { await p.goto(SITE + path, { waitUntil: "domcontentloaded", timeout: 30000 }); await sleep(700); };
const btn = (name) => p.getByRole("button", { name }).first();
const tryDo = async (label, fn) => { try { await fn(); } catch (e) { errs.push(`${label}: ${String(e).split("\n")[0]}`); } };
/** Eased scroll by dy pixels over ms, like a hand on a trackpad. */
const glide = async (dy, ms = 1200) => {
  const n = Math.max(1, Math.round(ms / 16));
  for (let i = 1; i <= n; i++) {
    const e = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    await p.mouse.wheel(0, dy * (e(i / n) - e((i - 1) / n)));
    await sleep(16);
  }
};
/** Scroll just enough to show the element's bottom, never far enough to reveal the site footer. */
const glideTo = async (sel, ms = 1200) => {
  const y = await p.locator(sel).first().evaluate((el) => {
    const foot = [...document.querySelectorAll("footer")].pop();
    const room = (foot ? foot.getBoundingClientRect().top : document.documentElement.scrollHeight - scrollY) - innerHeight;
    return Math.max(0, Math.min(el.getBoundingClientRect().bottom - innerHeight * 0.86, room));
  });
  if (y > 4) await glide(y, ms);
};
/** A visible tap: the cursor glides to the control, a ripple marks the touch, then a click without scroll jumps. */
const tap = async (loc) => {
  const el = loc.first();
  const box = await el.boundingBox();
  if (box && box.y > 0 && box.y + box.height < H) {
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await p.mouse.move(x, y, { steps: 22 });
    await p.evaluate(([x, y]) => window.__voxTap?.(x, y), [x, y]);
    await sleep(120);
  }
  await el.evaluate((n) => n.click());
};
const next = () => tap(btn(/Next discovery|Explore next chapter|See my discoveries/));

async function record(id, setup, act, pos) {
  const sc = timed.find((s) => s.id === id);
  const dir = `build/frames/${id}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  if (setup) await setup();
  await p.evaluate((x) => { window.__vox?.(""); window.__voxPos?.(x); }, pos ?? "left");
  const frames = [];
  let t0 = null, k = 0;
  const onFrame = ({ data, metadata, sessionId }) => {
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    if (t0 == null) return;
    const name = `${String(k++).padStart(5, "0")}.jpg`;
    writeFileSync(`${dir}/${name}`, Buffer.from(data, "base64"));
    frames.push({ name, t: metadata.timestamp - t0 });
  };
  cdp.on("Page.screencastFrame", onFrame);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  t0 = Date.now() / 1000;
  const start = Date.now();
  const at = async (s) => { const w = start + s * 1000 - Date.now(); if (w > 0) await sleep(w); };
  const L = sc.lines.map((l) => l.at);
  // captions follow the narration, independently of the actions
  const caps = (async () => {
    for (const l of sc.lines) {
      if (!l.cap) continue;
      await at(l.at + 0.15);
      // re-applied until the line ends, so a page navigation mid-line keeps its caption
      const until = start + Math.min(l.at + l.dur + 0.3, sc.dur - 0.3) * 1000;
      while (Date.now() < until) {
        await p.evaluate(([t, x]) => { window.__voxPos?.(x); if (window.__voxCap !== t || !document.querySelector("#vox-cap span")) window.__vox?.(t); }, [l.cap, pos ?? "left"]).catch(() => {});
        await sleep(Math.min(250, Math.max(0, until - Date.now())));
      }
      await p.evaluate(() => window.__vox?.("")).catch(() => {});
    }
  })();
  await act(at, L, sc.dur);
  await caps;
  await at(sc.dur + 0.2);
  // nudge one last frame so the hold ends exactly at the scene end
  await p.mouse.move(W - 2, H - 2);
  await sleep(150);
  await cdp.send("Page.stopScreencast");
  cdp.off("Page.screencastFrame", onFrame);
  writeFileSync(`${dir}/frames.json`, JSON.stringify({ dur: sc.dur, frames }));
  console.log(`${id.padEnd(10)} ${frames.length} frames over ${sc.dur}s`);
}

const scenes = {
  hook: [() => go("/"), async (at, L, dur) => {
    const card = (st) => p.evaluate((x) => window.__voxCard?.(x), st);
    await at(L[0]); await card("earth");
    await at(L[2]); await card("space");
    await at(L[4]); await card("flow");
    await at(dur - 1.3); await card("");
  }],
  problem: [() => go("/experiments/bass2-B20"), async (at, L) => {
    await at(L[1]); await glide(520, 3000);
    await at(L[3]); await glide(-520, 2200);
  }],
  freefall: [async () => { await go("/story"); await p.evaluate(() => localStorage.clear()); await go("/story"); }, async (at, L) => {
    await at(0.4); await tryDo("start", () => tap(btn("Start the mission")));
    await at(L[1]); await tryDo("hello-next", () => tap(p.locator(".game-sheet button.story-cta")));
    await at(L[1] + 2.6); await tryDo("gravity", () => tap(btn("Switch off gravity")));
    await at(L[2]); await tryDo("gravity-next", () => tap(p.locator(".game-sheet button.story-cta")));
    await at(L[2] + 1.6); await tryDo("duct", async () => { const c = p.locator(".game-part", { hasText: "Flow duct" }); await tap(c); await sleep(500); await tap(c); });
    await at(L[2] + 3.2); await tryDo("quick", () => tap(btn("Quick build")));
  }, "right"],
  adventure: [async () => { await go("/expedition"); await p.evaluate(() => localStorage.removeItem("microfire-spark-journey-v1")); await go("/expedition"); }, async (at, L) => {
    await at(L[1] + 1.5); await p.mouse.move(1500, 480, { steps: 25 });
    await at(L[2]); await tryDo("follow", () => tap(btn(/follow the spark/i)));
  }],
  vision: [null, async (at, L) => {
    await at(0.3); await tryDo("film", () => tap(p.locator("button", { hasText: "Investigate this flame" }).first()));
    await at(1.4); await tryDo("play", () => tap(p.getByRole("button", { name: "Play", exact: true })));
    await at(L[1]); await tryDo("vision", () => tap(p.getByRole("tab", { name: "AI vision" })));
    await at(L[1] + 2.8); await tryDo("metric", () => tap(p.locator(".exp-metrics button")));
    await at(L[2]); await tryDo("measure", () => tap(p.getByRole("tab", { name: "Measurements" })));
  }],
  trace: [null, async (at, L) => {
    await at(0.2); await tryDo("next", next);
    await at(L[1]); await tryDo("A", () => tap(btn("Outline A")));
    await at(L[2]); await tryDo("B", () => tap(btn("Outline B")));
  }],
  predict: [null, async (at, L) => {
    await at(0.2); await tryDo("next", next);
    await at(L[1] + 1.4); await tryDo("less", () => tap(btn("Less airflow")));
    await at(L[2] + 0.6); await tryDo("scroll", () => glideTo('[class*="predict"]', 1400));
    await at(L[3] + 1.0); await tryDo("predict", () => tap(btn("It went out")));
    await at(L[4] + 1.2); await tryDo("cite", () => glideTo('[class*="record"] blockquote', 1600));
  }],
  moon: [null, async (at, L) => {
    await at(0.2); await tryDo("next", next);
    await at(L[2]); await tryDo("cand0", () => tap(p.locator('[class*="candidates"] button').nth(0)));
    await at(L[2] + 1.6); await tryDo("cand1", () => tap(p.locator('[class*="candidates"] button').nth(1)));
    await at(L[3] + 0.4); await tryDo("scroll", () => glideTo('[class*="candidates"] + [role="status"]', 1200));
    await at(L[4]); await tryDo("next", next);
    await at(L[4] + 1.6); await tryDo("answer", () => tap(btn("We need more evidence for these conditions.")));
  }],
  finale: [null, async (at, L) => {
    await at(0.2); await tryDo("next", next);
    await at(1.2); await tryDo("ask", () => tap(btn("What changed between B16, B20 and B19?")));
    await at(L[1]); await tryDo("finale", next);
    await at(L[2]); await tryDo("debrief", () => glideTo('[class*="debrief"]', 1600));
    await at(L[2] + 2.2); await tryDo("nick", () => p.getByLabel(/Nickname/).pressSequentially("Ada", { delay: 140 }));
  }],
  science: [() => go("/atlas"), async (at, L) => {
    await at(1.0); await glide(560, 2400);
    await at(L[1] - 0.3); await go("/experiments/bass2-B16"); await glide(260, 1400);
    await at(L[2] - 0.3); await go("/methodology");
    await p.evaluate(() => { const el = [...document.querySelectorAll("p")].find((x) => x.textContent.includes("quoted findings are checked")); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.45); });
    await at(L[3] - 0.3); await go("/gaps"); await glide(300, 2000);
  }],
  close: [() => go("/"), async (at) => { await at(2.5); await p.mouse.move(1500, 300, { steps: 40 }); }],
};

// warm-up: let the window settle on the main display before the first scene
await go("/"); await sleep(1500);
// the first screencast in a fresh window comes out zoomed; burn one before recording
cdp.on("Page.screencastFrame", ({ sessionId }) => cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {}));
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 50, maxWidth: W, maxHeight: H });
await sleep(2500); await cdp.send("Page.stopScreencast"); await sleep(500);
for (const s of timed) {
  if (only && s.id !== only) continue;
  const [setup, act, pos] = scenes[s.id];
  await record(s.id, setup, act, pos);
}
console.log(errs.length ? "ISSUES:\n" + errs.join("\n") : "no issues");
await b.close();
