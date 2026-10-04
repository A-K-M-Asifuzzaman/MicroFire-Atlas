/**
 * Renders the real site frame by frame on a virtual clock, so the film is perfectly smooth at any resolution.
 *
 * Real-time screen capture stutters whenever Chrome pauses. Here nothing runs in real time:
 * - Playwright's clock drives the page's timers, requestAnimationFrame and Date (three.js, React timers);
 * - every CSS animation and transition is paused and set to the virtual time each frame (Web Animations API);
 * - playing videos are seeked to the virtual time each frame;
 * - scrolling and the cursor are tweened by this script, and clicks happen between frames.
 * Each frame is screenshotted at 2x (3840x2160) and piped straight into ffmpeg: build/<scene>.mp4.
 * Scene timing comes from the narration (build/timed.json), so picture and voice line up exactly.
 *
 *   SITE=http://localhost:3417 node capture.mjs [sceneId|all] [maxFrames]
 * The overlay (captions, cursor, explainer, end card) is recording-only; bypassCSP is a recording-only setting.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SITE = process.env.SITE ?? "http://localhost:3417";
const FPS = +(process.env.FPS ?? 60);
const SCALE = +(process.env.SCALE ?? 2); // 2 -> 3840x2160
const W = 1920, H = 1080;
const timed = JSON.parse(readFileSync("build/timed.json", "utf8"));
const [only, maxFrames] = [process.argv[2], +(process.argv[3] ?? 0)];
const OVERLAY = readFileSync(new URL("./overlay.js", import.meta.url), "utf8");

/** Runs inside the page each frame: CSS animations and videos follow the virtual clock; `fade` blacks out. */
const DRIVE = `window.__drive = async (fade) => {
  const now = performance.now();
  for (const a of document.getAnimations()) {
    if (a.__born == null) { a.__born = now; a.pause(); }
    a.currentTime = now - a.__born;
  }
  const seeks = [];
  for (const v of document.querySelectorAll("video")) {
    if (v.paused || v.readyState < 1) { v.__vt0 = null; continue; }
    if (v.__vt0 == null) { v.__vt0 = now; v.__ct0 = v.currentTime; v.playbackRate = 0.0625; }
    const target = Math.min(v.__ct0 + (now - v.__vt0) / 1000, (v.duration || 1e9) - 0.05);
    if (Math.abs(v.currentTime - target) > 0.001) {
      seeks.push(new Promise((ok) => { v.addEventListener("seeked", ok, { once: true }); setTimeout(ok, 800); }));
      v.currentTime = target;
    }
  }
  const f = document.getElementById("vox-fade"); if (f) f.style.opacity = String(fade);
  await Promise.all(seeks);
  return [scrollX, scrollY];
};`;
const FADE = `addEventListener("DOMContentLoaded", () => { const d = document.createElement("div"); d.id = "vox-fade";
  d.setAttribute("style", "position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:2147483647"); document.body.append(d); });`;

const b = await chromium.launch({ headless: true, channel: "chromium", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, bypassCSP: true });
await ctx.addInitScript(() => {
  try { // the state a child has after pressing "Got it" on each page's crew tip
    const k = "microfire-explorer-v2", s = JSON.parse(localStorage.getItem(k) || "{}");
    s.tips = ["home", "story", "atlas", "analyze", "compare", "mission", "gaps", "ask", "methodology", "sources", "experiment", "expedition", "learn", "saffire"];
    s.seen = [...s.tips, "saffire", "tour"]; // PIX's "show you around" nudge already answered
    localStorage.setItem(k, JSON.stringify(s));
  } catch {}
});
await ctx.addInitScript(OVERLAY);
await ctx.addInitScript(DRIVE);
await ctx.addInitScript(FADE);
await ctx.clock.install({ time: new Date("2026-10-02T12:00:00Z") });
await ctx.clock.pauseAt(new Date("2026-10-02T12:00:01Z"));
const p = await ctx.newPage();
p.setDefaultTimeout(8000);
const cdp = await ctx.newCDPSession(p);
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));

const ease = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
const btn = (name) => p.getByRole("button", { name }).first();
const nextBtn = () => btn(/Next discovery|Explore next chapter|See my discoveries/);
/** Load a page and let it settle on the virtual clock (fonts, images, hydration, entrance animations). */
const go = async (path) => {
  await p.goto(SITE + path, { waitUntil: "load", timeout: 45000 });
  await p.evaluate(() => document.fonts.ready);
  for (let i = 0; i < 12; i++) { await ctx.clock.runFor(50); await p.evaluate(() => window.__drive?.(0)); }
};

// Ask PIX: the real /api/ask answer is held until the moment the film wants it to land
let askRelease = null;
await p.route("**/api/ask", async (route) => {
  const res = await route.fetch();
  const body = await res.body();
  await new Promise((ok) => { askRelease = ok; });
  await route.fulfill({ response: res, body });
});

async function render(sc, setup, build, pos = "left") {
  if (setup) await setup();
  const events = [], tweens = [];
  let cursor = { x: W * 0.62, y: H * 0.58 };
  const at = (t, fn) => events.push({ t: Math.max(0, t), fn });
  const scrollTween = (t, d, y0, dy) => tweens.push({ t0: t, t1: t + d, apply: (u) => p.evaluate((y) => scrollTo(0, y), y0 + dy * ease(u)) });
  const S = {
    L: sc.lines.map((l) => l.at), lines: sc.lines, dur: sc.dur, at, tweens,
    go: (t, path) => at(t, () => go(path)),
    /** Scroll by dy over d seconds from t. */
    glide: (t, d, dy) => at(t, async () => scrollTween(t, d, await p.evaluate(() => scrollY), dy)),
    /** Scroll just enough to show the element's bottom, never far enough to reveal the site footer. */
    glideTo: (t, d, sel) => at(t, async () => {
      const [y0, dy] = await p.locator(sel).first().evaluate((el) => {
        const foot = [...document.querySelectorAll("footer")].pop();
        const room = (foot ? foot.getBoundingClientRect().top : document.documentElement.scrollHeight - scrollY) - innerHeight;
        return [scrollY, Math.max(0, Math.min(el.getBoundingClientRect().bottom - innerHeight * 0.86, room))];
      }).catch(() => [0, 0]);
      if (dy > 4) scrollTween(t, d, y0, dy);
    }),
    /** Scroll so the element's top sits at `frac` of the screen height. */
    glideEl: (t, d, sel, frac = 0.12) => at(t, async () => {
      const [y0, dy] = await p.locator(sel).first().evaluate((el, f) => [scrollY, el.getBoundingClientRect().top - innerHeight * f], frac).catch(() => [0, 0]);
      if (Math.abs(dy) > 4) scrollTween(t, d, y0, dy);
    }),
    /** Glide the cursor to (x, y). */
    point: (t, d, x, y) => at(t, () => {
      const a = { ...cursor };
      cursor = { x, y };
      tweens.push({ t0: t, t1: t + d, apply: (u) => p.mouse.move(a.x + (x - a.x) * ease(u), a.y + (y - a.y) * ease(u)) });
    }),
    /** A visible tap at t: the cursor travels for 0.55 s, a ripple marks the touch, then the control is clicked. */
    tap: (t, loc, label) => {
      const t0 = Math.max(0, t - 0.55);
      at(t0, async () => {
        const box = await loc().first().boundingBox().catch(() => null);
        if (!box || box.y < 0 || box.y + box.height > H) return;
        const a = { ...cursor }, x = box.x + box.width / 2, y = box.y + box.height / 2;
        cursor = { x, y };
        tweens.push({ t0, t1: t, apply: (u) => p.mouse.move(a.x + (x - a.x) * ease(u), a.y + (y - a.y) * ease(u)) });
      });
      at(t, async () => {
        try {
          const el = loc().first();
          await el.waitFor({ state: "attached", timeout: 8000 });
          await p.evaluate(([x, y]) => window.__voxTap?.(x, y), [cursor.x, cursor.y]);
          await el.evaluate((n) => n.click());
        } catch (e) { errs.push(`${sc.id} ${label}: ${String(e).split("\n")[0]}`); }
      });
    },
  };
  build(S);
  // captions follow the narration and are re-applied after any navigation
  let cap = "";
  if (pos !== "none") for (const l of sc.lines) {
    if (!l.cap) continue;
    at(l.at + 0.15, async () => { cap = l.cap; await p.evaluate(([t, x]) => { window.__voxPos?.(x); window.__vox?.(t); }, [cap, pos]); });
    at(Math.min(l.at + l.dur + 0.3, sc.dur - 0.3), async () => { cap = ""; await p.evaluate(() => window.__vox?.("")); });
  }
  events.sort((a, b) => a.t - b.t);
  await p.evaluate((x) => { window.__vox?.(""); window.__voxPos?.(x); }, pos);

  const N = maxFrames || Math.round(sc.dur * FPS);
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", String(FPS), `build/${sc.id}.mp4`], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, bad) => ff.on("close", (c) => (c ? bad(new Error("ffmpeg " + c)) : ok())));
  const fin = sc.id === timed[0].id ? 0.8 : 0.18, fout = sc.id === timed[timed.length - 1].id ? 1.6 : 0.18;
  const started = Date.now();
  let ei = 0, askAt = null;
  for (let n = 0; n < N; n++) {
    const t = n / FPS;
    while (ei < events.length && events[ei].t <= t + 1e-6) {
      const before = p.url();
      await events[ei++].fn();
      if (p.url() !== before && cap) await p.evaluate(([c, x]) => { window.__voxPos?.(x); window.__vox?.(c); }, [cap, pos]);
    }
    for (const tw of tweens) if (t >= tw.t0 && t <= tw.t1 + 1 / FPS) await tw.apply(Math.min(1, (t - tw.t0) / (tw.t1 - tw.t0)));
    if (askRelease) { askAt ??= t + 1.1; if (t >= askAt) { askRelease(); askRelease = null; askAt = null; } }
    const fade = Math.max(t < fin ? 1 - t / fin : 0, t > sc.dur - fout ? (t - (sc.dur - fout)) / fout : 0);
    // the clip is in document coordinates, so it must follow the scroll position or scrolled pages come out black
    const [sx, sy] = (await p.evaluate((f) => window.__drive?.(f), Math.min(1, fade))) ?? [0, 0];
    const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 92, optimizeForSpeed: true, clip: { x: sx, y: sy, width: W, height: H, scale: SCALE } });
    if (!ff.stdin.write(Buffer.from(data, "base64"))) await new Promise((ok) => ff.stdin.once("drain", ok));
    await ctx.clock.runFor(Math.round(((n + 1) * 1000) / FPS) - Math.round((n * 1000) / FPS));
    if (n % (FPS * 5) === 0) process.stdout.write(`  ${sc.id} ${t.toFixed(0)}s/${sc.dur.toFixed(0)}s (${((Date.now() - started) / 1000 / (n + 1)).toFixed(2)} s/frame)\n`);
  }
  ff.stdin.end();
  await done;
  console.log(`${sc.id.padEnd(10)} ${N} frames in ${((Date.now() - started) / 1000).toFixed(0)} s`);
}

const fx = {
  crew: (who, line, pose) => () => p.evaluate(([w, l, po]) => window.__voxCrew?.(w, l, po), [who, line, pose]),
  stars: (x, y) => () => p.evaluate(([a, b]) => window.__voxStars?.(a, b), [x, y]),
  /** stars bursting from the centre of an element */
  starsAt: (sel) => async () => { const b = await p.locator(sel).first().boundingBox().catch(() => null); if (b) await p.evaluate(([a, c]) => window.__voxStars?.(a, c), [b.x + b.width / 2, b.y + b.height / 2]); },
  sticker: (text, x, y) => () => p.evaluate(([t, a, b]) => window.__voxSticker?.(t, a, b), [text, x, y]),
};
const toEl = (sel, off = 80) => () => p.evaluate(([s, o]) => { const el = document.querySelector(s); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - o); }, [sel, off]);

const chapter = (n, part, title, line) => () => p.evaluate(([a, b, c, d]) => window.__voxChapter?.(a, b, c, d), [n, part, title, line]);
const lineEnd = (S, k, back = 0.6) => S.lines[k].at + S.lines[k].dur - back;

// SCENES=path/to/scenes.mjs swaps in another film's choreography (run from that film's folder, which holds its build/)
const scenes = process.env.SCENES ? (await import(pathToFileURL(resolve(process.env.SCENES)).href)).default({ p, ctx, go, btn, nextBtn, fx, chapter, toEl, lineEnd }) : {
  // cold open: real NASA footage, letterboxed, kinetic words, then the title reveal
  coldopen: [() => go("/"), (S) => {
    const cold = (st) => () => p.evaluate((x) => window.__voxCold?.(x), st);
    S.at(0, cold("on"));
    S.at(0.25, cold("a"));
    S.at(S.L[0] - 0.05, cold("b"));
    S.at(S.L[1] + 1.2, cold("c"));
    S.at(lineEnd(S, 2, -0.35), cold("d"));
  }, "none"],
  hook: [() => go("/"), (S) => {
    const card = (st) => () => p.evaluate((x) => window.__voxCard?.(x), st);
    S.at(S.L[0], card("earth")); S.at(S.L[1], card("space")); S.at(S.L[2] + 1.6, card("flow")); S.at(S.dur - 1.2, card(""));
  }],
  intro: [null, (S) => {
    S.glide(S.L[0] + 0.4, 2.0, 380);
    S.glideEl(S.L[1] - 0.2, 2.2, "#paths", 0.08);
    S.at(S.L[1] + 0.6, fx.crew("tala", "Two ways in. Pick yours!", "pointing"));
    S.point(S.L[1] + 1.4, 1.0, 560, 640);
    S.point(S.L[1] + 3.4, 1.0, 1300, 640);
    S.at(S.dur - 0.9, fx.crew(""));
  }],
  freefall: [async () => { await go("/story"); await p.evaluate(() => localStorage.clear()); await go("/story"); }, (S) => {
    const sheetNext = () => p.locator(".game-sheet button.story-cta");
    const duct = () => p.locator(".game-part", { hasText: "Flow duct" });
    S.at(0.05, chapter(1, "PART ONE", "The explorer's adventure", "Learn by playing with real NASA evidence"));
    S.tap(2.85, () => btn("Start the mission"), "start");
    S.tap(3.5, sheetNext, "hello-next");
    S.tap(S.L[0] + 1.3, () => btn("Switch off gravity"), "gravity");
    S.at(S.L[0] + 1.6, fx.stars(960, 520));
    S.tap(S.L[1] - 0.1, sheetNext, "gravity-next");
    S.tap(S.L[1] + 0.9, duct, "duct-preview");
    S.tap(S.L[1] + 1.5, duct, "duct-install");
    S.tap(S.L[1] + 2.4, () => btn("Quick build"), "quick");
    S.at(S.L[1] + 2.6, fx.sticker("Built it!", 1250, 300));
  }, "right"],
  film: [async () => { await go("/expedition"); await p.evaluate(() => localStorage.removeItem("microfire-spark-journey-v1")); await go("/expedition"); }, (S) => {
    S.tap(0.4, () => btn(/follow the spark/i), "follow");
    S.tap(1.3, () => p.locator("button", { hasText: "Investigate this flame" }), "film");
    S.tap(2.3, () => p.getByRole("button", { name: "Play", exact: true }), "play");
    S.tap(S.L[0] + 2.8, () => p.locator('[data-mode="vision"]'), "vision");
    S.at(S.L[0] + 3.1, fx.sticker("Measured in pixels", 1180, 230));
    S.tap(S.L[1] - 0.2, nextBtn, "to-trace");
    S.tap(S.L[1] + 0.7, nextBtn, "to-predict");
    S.tap(S.L[1] + 2.2, () => btn("Less airflow"), "less");
    S.glideTo(S.L[2] + 0.3, 1.2, '[class*="predict"]');
    S.tap(S.L[2] + 2.4, () => btn("It went out"), "predict");
    S.glideTo(S.L[3] + 0.4, 1.4, '[class*="record"] blockquote');
    S.at(S.L[3] + 2.0, fx.starsAt('[class*="record"] blockquote'));
  }],
  moon: [null, (S) => {
    const card = (t) => () => p.locator('ul[aria-label="Clue cards to sort"] button', { hasText: t });
    const rung = (r) => () => p.locator(`button[aria-label^="Place the selected clue on the ${r} rung"]`);
    S.tap(0.5, nextBtn, "next");
    S.glideTo(S.L[0] + 1.5, 1.2, 'ul[aria-label="Clue cards to sort"]');
    S.tap(S.L[0] + 2.9, card("Small flame"), "c-b20");
    S.tap(S.L[0] + 3.8, rung("Analogous"), "r-b20");
    S.tap(S.L[1] + 0.4, card("Tiny burning"), "c-flex");
    S.tap(S.L[1] + 2.0, rung("Mechanistic"), "r-flex");
    S.tap(S.L[1] + 3.3, card("Big fire"), "c-saffire");
    S.tap(S.L[1] + 4.1, rung("Analogous"), "r-saffire");
    S.tap(S.L[2] - 0.2, card("nobody has done"), "c-gap");
    S.tap(S.L[2] + 0.6, rung("Gap"), "r-gap");
    S.at(S.L[2] + 1.0, fx.sticker("The next experiment!", 1150, 260));
  }],
  atlas: [async () => { await go("/atlas"); await toEl('aside[aria-label="Page quests"]', 90)(); }, (S) => {
    S.tap(S.L[0] + 1.6, () => p.locator("ul[aria-label=Tests] button", { hasText: "B19" }), "tile");
    S.at(S.L[0] + 1.9, fx.starsAt('aside[aria-label="Page quests"] li:nth-child(2)'));
    S.glideEl(S.L[1] - 0.3, 1.2, '[data-guide="filters"]', 0.05);
    S.tap(S.L[1] + 0.9, () => btn("Detective table"), "detective");
    S.glideEl(S.L[1] + 1.3, 1.1, '[data-guide="table"]', 0.06);
    S.tap(S.L[1] + 2.5, () => p.getByRole("button", { name: "Oxygen", exact: true }), "sort");
    S.glideEl(S.L[1] + 2.9, 1.6, 'button[aria-label="Answer with test B20"]', 0.55);
    S.tap(lineEnd(S, 1, 0.8), () => p.getByRole("button", { name: "Answer with test B20" }), "b20");
    S.at(lineEnd(S, 1, 0.6), fx.starsAt('button[aria-label="Answer with test B20"]'));
    S.at(lineEnd(S, 1, 0.4), fx.crew("mei", "Solved! Real NASA data.", "cheering"));
    S.at(S.L[2] - 0.5, fx.crew(""));
    S.glideEl(S.L[2] - 0.4, 1.3, 'aside[aria-label="Page quests"]', 0.12);
    S.tap(S.L[2] + 1.2, () => p.getByRole("tab", { name: /LUCI/ }), "luci");
    S.at(S.L[2] + 1.5, fx.starsAt('aside[aria-label="Page quests"]'));
  }],
  saffire: [() => go("/saffire"), (S) => {
    S.at(0.05, chapter(2, "PART TWO", "The mission planner's workstation", "Mission-conditioned evidence, ranked and checked"));
    S.at(S.L[0] + 0.8, fx.crew("kofi", "A fire in a spaceship? On purpose!", "cheering"));
    S.glideEl(S.L[1] - 0.2, 2.2, 'li[id^="saffire-"]', 0.2);
    S.at(S.L[1] + 0.4, fx.crew(""));
    S.at(S.L[1] + 2.4, fx.sticker("Every number traced", 1100, 220));
  }],
  analyst: [async () => { await go("/mission?context=moon-base-alt"); await toEl("#step-atmosphere", 70)(); }, (S) => {
    S.tap(S.L[0] + 1.0, () => p.locator('[role="radio"]', { hasText: "Alternate exploration atmosphere" }), "alt");
    S.glideEl(S.L[0] + 2.8, 1.6, "#step-conditions", 0.06);
    S.at(S.L[1] - 0.6, () => p.locator('input[type="range"]').first().focus());
    for (let k = 0; k < 11; k++) S.at(S.L[1] + 0.2 + k * 0.17, () => p.keyboard.press("ArrowRight"));
    S.at(S.L[1] + 2.3, fx.sticker("Empty space!", 1300, 200));
    S.glideEl(S.L[2] - 0.3, 1.8, "#step-status", 0.06);
    S.at(S.L[2] + 3.4, fx.sticker("No guessing!", 1200, 260));
    S.glideEl(S.L[3] - 0.3, 2.0, "#ranked-findings", 0.06);
    S.at(S.L[3] + 2.0, fx.starsAt("#ranked-findings li:first-child"));
    S.at(S.L[3] + 2.4, fx.crew("mei", "Why each finding matters!", "pointing"));
    S.at(S.dur - 0.8, fx.crew(""));
  }],
  trust: [async () => { await go("/methodology"); await p.evaluate(() => { document.documentElement.style.zoom = "1.25"; const el = [...document.querySelectorAll("p")].find((x) => x.textContent.includes("Drag a weight and watch")); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - 140); }); }, (S) => {
    const knob = () => p.locator('input[type="range"]').first();
    [1.25, 1.5, 1.75, 2].forEach((v, k) => S.at(S.L[0] + 0.6 + k * 0.45, () => knob().fill(String(v))));
    S.at(S.L[0] + 0.4, fx.crew("mei", "Change the rules. Does it still hold?", "thinking"));
    S.at(S.L[1] - 0.2, fx.crew(""));
    S.at(S.L[1] - 0.1, () => p.evaluate(() => { const el = [...document.querySelectorAll("h3")].find((x) => x.textContent.includes("Before the model")); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90 }); }));
    S.at(S.L[1] + 0.6, fx.sticker("98 of 100", 1250, 300));
    S.at(S.L[2] - 0.1, () => p.evaluate(() => { const el = [...document.querySelectorAll("h3")].find((x) => x.textContent.includes("fool the checker")); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70 }); }));
    S.tap(S.L[2] + 1.2, () => p.getByRole("button", { name: "It gets flagged" }).nth(1), "wrong-number");
    S.tap(S.L[2] + 3.0, () => p.getByRole("button", { name: "It gets flagged" }).nth(1), "moon-claim");
    S.tap(S.L[2] + 4.8, () => p.getByRole("button", { name: "It gets flagged" }).nth(1), "unit-swap");
    S.at(S.L[2] + 5.2, fx.sticker("Caught!", 1300, 260));
  }],
  frontier: [async () => { await go("/gaps"); await p.evaluate(() => { document.documentElement.style.zoom = "1.25"; }); await toEl("#horizon", 70)(); }, (S) => {
    S.at(0.05, chapter(3, "PART THREE", "Where the evidence stops", "And the experiment that would push it further"));
    S.at(S.L[0] + 0.6, fx.crew("tala", "To the Moon!", "cheering"));
    S.glideEl(S.L[1] - 0.2, 2.0, 'li[data-closes="true"]', 0.45);
    S.at(S.L[1] + 2.2, fx.starsAt('li[data-closes="true"]'));
    S.at(S.dur - 0.9, fx.crew(""));
  }],
  // the finale: an animated end card over the home page, staged on the closing lines, then the credits
  close: [() => go("/"), (S) => {
    const end = (st) => () => p.evaluate((x) => window.__voxEnd?.(x), st);
    const l1 = S.lines[1], parts = ["Real NASA data. ", "A real adventure. ", "And honest answers about what we still don't know."];
    const total = parts.join("").length;
    let acc = 0;
    S.at(0.1, end(1));
    S.at(S.L[0], end(2));
    parts.forEach((x, i) => { S.at(l1.at + (l1.dur * acc) / total, end(3 + i)); acc += x.length; });
    S.at(S.L[2], end(6));
    S.at(lineEnd(S, 2, -1.2), end(7));
  }, "none"],
};

for (const sc of timed) {
  if (only && only !== "all" && sc.id !== only) continue;
  const [setup, build, pos] = scenes[sc.id];
  await render(sc, setup, build, pos);
}
console.log(errs.length ? "ISSUES:\n" + errs.join("\n") : "no issues");
await b.close();
