/**
 * Choreography for the full guided tour (film/guide). Rendered by ../explorer/capture.mjs:
 *   cd film/guide && SCENES=scenes.mjs SITE=http://localhost:3417 node ../explorer/capture.mjs all
 * Every scene drives the real site; S.L[k] is the start time of narration line k (script.json).
 */
export default ({ p, go, btn, nextBtn, fx, chapter, toEl, lineEnd }) => {
  const zoom = (z) => () => p.evaluate((x) => { document.documentElement.style.zoom = String(x); }, z);
  const cold = (st) => () => p.evaluate((x) => window.__voxCold?.(x), st);
  const heading = (text, off = 90) => () => p.evaluate(([t, o]) => { const el = [...document.querySelectorAll("h2,h3")].find((x) => x.textContent.includes(t)); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - o }); }, [text, off]);

  return {
    // same cinematic opening as the competition film: real NASA footage, kinetic words, title reveal
    coldopen: [() => go("/"), (S) => {
      S.at(0, cold("on"));
      S.at(0.25, cold("a"));
      S.at(S.L[0] - 0.05, cold("b"));
      S.at(S.L[1] + 1.2, cold("c"));
      S.at(lineEnd(S, 2, -0.35), cold("d"));
    }, "none"],

    what: [() => go("/"), (S) => {
      S.glide(S.L[1] + 0.5, 2.4, 420);
      S.glideEl(S.L[2] + 0.4, 2.2, "#corpus-title", 0.12);
      S.at(S.L[2] + 2.8, fx.sticker("Every value traced", 1250, 240));
      S.glideEl(S.L[3] - 0.3, 2.2, "#paths", 0.08);
      S.at(S.L[3] + 0.8, fx.crew("tala", "Two ways in. Pick yours!", "pointing"));
      S.point(S.L[3] + 1.6, 1.0, 560, 640);
      S.point(S.L[3] + 3.4, 1.0, 1300, 640);
      S.at(S.dur - 0.9, fx.crew(""));
    }],

    challenge: [() => go("/challenge"), (S) => {
      S.at(0.05, chapter(1, "PART ONE", "The challenge, answered", "One mission question in nine stages"));
      S.glideEl(S.L[1] - 0.2, 1.8, "#stage-1", 0.1);
      S.glideEl(S.L[2] - 0.2, 1.8, "#stage-2", 0.1);
      S.glideEl(S.L[3] - 0.2, 1.8, "#stage-3", 0.1);
      S.glideEl(S.L[3] + 4.2, 2.0, "#stage-4", 0.1);
      S.glideEl(S.L[4] - 0.2, 2.0, "#stage-7", 0.1);
      S.at(S.L[4] + 3.0, fx.sticker("Never tested together", 1250, 230));
      S.glideEl(S.L[5] - 0.3, 2.0, "#says-no", 0.22);
      S.at(S.L[5] + 2.2, fx.crew("mei", "No number. Just honest evidence.", "pointing"));
      S.at(S.dur - 0.9, fx.crew(""));
    }],

    atlas: [async () => { await go("/atlas"); await toEl('[data-guide="filters"]', 90)(); }, (S) => {
      S.at(0.05, chapter(2, "PART TWO", "The NASA evidence", "78 test records, traced to their pages"));
      S.glideEl(S.L[1] - 0.2, 1.2, '[data-guide="filters"]', 0.05);
      S.tap(S.L[1] + 1.6, () => btn("Detective table"), "detective");
      S.glideEl(S.L[1] + 2.0, 1.4, '[data-guide="table"]', 0.06);
      S.tap(S.L[1] + 3.6, () => p.getByRole("button", { name: "Oxygen", exact: true }), "sort");
      S.go(S.L[2] - 0.2, "/experiments/bass2-B20");
      S.glide(S.L[2] + 1.2, 3.2, 520);
      S.at(S.L[2] + 4.4, fx.sticker("Linked to the PDF page", 1250, 230));
    }],

    compare: [() => go("/compare?preset=fabric-three-sizes"), (S) => {
      S.glideEl(S.L[0] + 1.0, 2.0, "#compare-tool", 0.08);
      S.glide(S.L[1] + 0.2, 3.0, 520);
      S.at(S.L[1] + 1.6, fx.sticker("Observed ≠ interpreted", 1250, 230));
    }],

    saffire: [() => go("/saffire"), (S) => {
      S.at(S.L[0] + 0.8, fx.crew("kofi", "A fire in a spaceship? On purpose!", "cheering"));
      S.glideEl(S.L[0] + 2.6, 2.2, 'li[id^="saffire-"]', 0.2);
      S.at(S.L[1] - 0.6, fx.crew(""));
      S.glideEl(S.L[1] - 0.2, 2.2, "#atm", 0.1);
    }],

    analyst: [async () => { await go("/mission?context=moon-base"); await toEl("#step-atmosphere", 70)(); }, (S) => {
      S.at(0.05, chapter(3, "PART THREE", "The mission planner's workstation", "Mission-conditioned evidence, ranked and checked"));
      S.glideEl(S.L[1] - 0.3, 1.6, "#step-conditions", 0.06);
      S.at(S.L[1] + 0.6, () => p.locator('input[type="range"]').first().focus());
      for (let k = 0; k < 10; k++) S.at(S.L[1] + 1.4 + k * 0.17, () => p.keyboard.press("ArrowRight"));
      S.at(S.L[1] + 3.4, fx.sticker("Past the evidence!", 1300, 200));
      S.glideEl(S.L[2] - 0.3, 1.8, "#step-status", 0.06);
      S.at(S.L[2] + 3.2, fx.sticker("No guessing!", 1200, 260));
      S.glideEl(S.L[3] - 0.3, 2.0, "#ranked-findings", 0.06);
      S.at(S.L[3] + 2.4, fx.starsAt("#ranked-findings li:first-child"));
      S.at(S.L[3] + 2.8, fx.crew("mei", "Why each finding ranks there!", "pointing"));
      S.at(S.L[4] - 0.4, fx.crew(""));
      S.glideEl(S.L[4] - 0.2, 2.0, "#fire-safety-insight", 0.08);
    }],

    frontier: [async () => { await go("/gaps"); await toEl("#matrix", 90)(); }, (S) => {
      S.at(0.05, chapter(4, "PART FOUR", "Where the evidence stops", "And what would push it further"));
      S.glideEl(S.L[0] + 3.0, 1.6, "#matrix", 0.12);
      S.glideEl(S.L[1] - 0.3, 2.0, "#research-planning", 0.06);
      S.glideEl(S.L[1] + 4.0, 2.0, "#research-board", 0.04);
      S.glideEl(S.L[1] + 7.6, 1.8, "#evidence-gain", 0.04);
      S.at(S.L[1] + 9.0, fx.sticker("Hypothetical, clearly labelled", 1250, 220));
      S.glideEl(S.L[2] - 0.3, 2.0, "#horizon", 0.08);
      S.at(S.L[2] + 0.6, fx.crew("tala", "To the Moon!", "cheering"));
      S.at(S.dur - 0.9, fx.crew(""));
    }],

    ask: [() => go("/ask"), (S) => {
      S.at(S.L[0] + 1.2, fx.sticker("Evidence first", 1250, 230));
      S.glideEl(S.L[1] - 0.2, 2.0, "#example-title", 0.08);
      S.glide(S.L[2] - 0.2, 1.6, 140);
      S.at(S.L[2] + 2.0, fx.starsAt("#example-title"));
    }],

    trust: [async () => { await go("/methodology"); await zoom(1.25)(); }, (S) => {
      const knob = () => p.locator('input[type="range"]').first();
      S.at(S.L[0] + 0.4, fx.crew("mei", "Change the rules. Does it still hold?", "thinking"));
      S.at(S.L[1] - 0.2, () => p.evaluate(() => { const el = [...document.querySelectorAll("p")].find((x) => x.textContent.includes("Drag a weight and watch")); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - 140); }));
      S.at(S.L[1] - 0.1, fx.crew(""));
      [1.25, 1.5, 1.75, 2].forEach((v, k) => S.at(S.L[1] + 0.8 + k * 0.45, () => knob().fill(String(v))));
      S.at(S.L[2] - 0.1, heading("Before the model"));
      S.at(S.L[2] + 0.6, fx.sticker("98 of 100", 1250, 300));
      S.at(S.L[2] + 4.6, heading("Finding gold set v2"));
      S.at(S.L[3] - 0.1, heading("fool the checker", 70));
      S.tap(S.L[3] + 1.4, () => p.getByRole("button", { name: "It gets flagged" }).nth(1), "wrong-number");
      S.tap(S.L[3] + 3.2, () => p.getByRole("button", { name: "It gets flagged" }).nth(1), "moon-claim");
      S.tap(S.L[3] + 5.0, () => p.getByRole("button", { name: "It gets flagged" }).nth(1), "unit-swap");
      S.at(S.L[3] + 5.4, fx.sticker("Caught!", 1300, 260));
    }],

    sources: [() => go("/sources"), (S) => {
      S.glide(S.L[0] + 0.6, 2.4, 600);
      S.glideEl(S.L[0] + 4.0, 2.0, "#downloads", 0.1);
    }],

    explorer: [async () => { await go("/story"); await p.evaluate(() => localStorage.removeItem("microfire-mission-freefall-v2")); await go("/story"); }, (S) => {
      const sheetNext = () => p.locator(".game-sheet button.story-cta");
      S.at(0.05, chapter(5, "PART FIVE", "For young explorers", "Learn by playing with real NASA evidence"));
      S.tap(2.85, () => btn("Start the mission"), "start");
      S.tap(3.5, sheetNext, "hello-next");
      S.tap(S.L[1] + 0.2, () => btn("Switch off gravity"), "gravity");
      S.at(S.L[1] + 0.5, fx.stars(960, 520));
      S.tap(S.L[1] + 1.5, sheetNext, "gravity-next");
      S.tap(S.L[1] + 2.4, () => p.locator(".game-part", { hasText: "Flow duct" }), "duct-preview");
      S.tap(S.L[1] + 3.0, () => p.locator(".game-part", { hasText: "Flow duct" }), "duct-install");
      S.tap(S.L[1] + 3.9, () => btn("Quick build"), "quick");
      S.at(S.L[1] + 4.4, fx.sticker("Built it!", 1250, 300));
      S.at(S.L[2] - 0.2, async () => { await go("/expedition"); await p.evaluate(() => localStorage.removeItem("microfire-spark-journey-v1")); await go("/expedition"); });
      S.tap(S.L[2] + 0.4, () => btn(/follow the spark/i), "follow");
      S.tap(S.L[2] + 1.2, () => p.locator("button", { hasText: "Investigate this flame" }), "film");
      S.tap(S.L[2] + 2.0, () => p.getByRole("button", { name: "Play", exact: true }), "play");
      S.tap(S.L[2] + 3.0, () => p.locator('[data-mode="vision"]'), "vision");
      S.at(S.L[2] + 3.3, fx.sticker("Measured in pixels", 1180, 230));
      S.tap(S.L[3] - 0.2, nextBtn, "to-trace");
      S.tap(S.L[3] + 0.6, nextBtn, "to-predict");
      S.tap(S.L[3] + 1.8, () => btn("Less airflow"), "less");
      S.glideTo(S.L[3] + 2.2, 1.2, '[class*="predict"]');
      S.tap(S.L[3] + 3.8, () => btn("It went out"), "predict");
      S.glideTo(S.L[3] + 4.6, 1.4, '[class*="record"] blockquote');
      S.at(S.L[3] + 6.0, fx.starsAt('[class*="record"] blockquote'));
    }],

    // the same animated end card as the competition film
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
};
