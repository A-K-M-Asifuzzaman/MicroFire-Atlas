/**
 * The 240-second pitch, built on the Space Apps "240 Seconds of Glory" model: WHO, WHY, WHAT, HOW.
 *   cd film/pitch && node team.mjs && EDGE_TTS=… python3 ../explorer/narrate.py
 *   SCENES=scenes.mjs EXTRA_OVERLAY=overlay-pitch.js,build/team.js SITE=http://localhost:3417 node ../explorer/capture.mjs all
 * S.L[k] is the start time of narration line k (script.json).
 */
export default ({ p, go, btn, fx, chapter, toEl, lineEnd }) => {
  const call = (fn, ...a) => () => p.evaluate(([f, args]) => window[f]?.(...args), [fn, a]);
  const quad = (n) => call("__vpQuad", n);
  const cold = (st) => call("__voxCold", st);
  const card = (st) => call("__voxCard", st);
  const zoom = (z) => () => p.evaluate((x) => { document.documentElement.style.zoom = String(x); }, z);
  const heading = (text, off = 90) => () => p.evaluate(([t, o]) => { const el = [...document.querySelectorAll("h2,h3,p")].find((x) => x.textContent.includes(t)); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - o }); }, [text, off]);
  // land straight on a Mission Freefall chapter, as a returning explorer would
  const freefallAt = (screen) => async () => {
    await p.evaluate((sc) => localStorage.setItem("microfire-mission-freefall-v2", JSON.stringify({ screen: sc, reached: sc, installed: [], fixes: { sample: false, fan: false }, answers: {}, observed: {}, labLit: false, gravityToggled: true, gravityOn: false, pinned: null, quietFound: false, gusted: false, placed: [], marker: false })), screen);
    await go("/story");
  };

  return {
    // 0:00 the circular hook: real NASA footage, kinetic words, title reveal
    coldopen: [async () => { await go("/"); await quad(0)(); }, (S) => {
      S.at(0, cold("on"));
      S.at(0.25, cold("a"));
      S.at(S.L[0] - 0.05, cold("b"));
      S.at(S.L[1] + 1.2, cold("c"));
      S.at(lineEnd(S, 2, -0.35), cold("d"));
    }, "none"],

    // 01 WHO: attention and authenticity
    who: [() => go("/"), (S) => {
      S.at(0.05, chapter(1, "WHO · ATTENTION & AUTHENTICITY", "Who we are", "And the three promises behind our work"));
      S.at(0.4, quad(1));
      S.at(S.L[0] - 0.2, call("__vpTeam", 1));
      S.at(S.L[1] - 0.1, call("__vpTeam", 2));
      S.at(S.L[2] - 0.1, call("__vpTeam", 3));
      S.at(S.L[3] - 0.1, call("__vpTeam", 4));
    }, "none"],

    // 02 WHY: empathy for the problem
    why: [async () => { await p.evaluate(() => localStorage.removeItem("microfire-mission-freefall-v2")); await go("/story"); }, (S) => {
      S.at(0.05, chapter(2, "WHY · CREATE EMPATHY", "Why it matters", "People, fire, and the evidence we don't have"));
      S.at(0.4, quad(2));
      S.at(S.L[0] - 0.3, call("__vpMemorial", 1));
      S.at(S.L[1] - 0.6, call("__vpMemorial", 0));
      S.tap(S.L[1] + 0.6, () => btn("Start the mission"), "start");
      S.at(S.L[2] + 0.6, fx.crew("tala", "One day, that could be me!", "pointing"));
      S.at(S.L[3] - 0.4, fx.crew(""));
      S.at(S.L[3] - 0.1, card("earth"));
      S.at(S.L[3] + 2.0, card("space"));
      S.at(S.L[3] + 4.6, card("flow"));
      S.at(S.L[4] - 0.5, card(""));
      S.go(S.L[4] - 0.2, "/mission?context=moon-base");
      S.at(S.L[4] + 0.2, toEl("#step-atmosphere", 70));
      S.at(S.L[4] + 3.4, fx.sticker("56.5 kPa · 34 % O₂", 1250, 230));
      S.at(S.L[5] - 0.2, call("__vpStats", 1));
      S.at(S.L[5] + 6.0, call("__vpStats", 2));
    }, "none"],

    // 03 WHAT: the big idea, shown live
    what: [() => go("/challenge"), (S) => {
      S.at(0.05, chapter(3, "WHAT · OUR BIG IDEA", "What we built", "A live demo of the real website"));
      S.at(0.4, quad(3));
      S.glide(S.L[0] + 1.0, 2.6, 180);
      S.glideEl(S.L[1] + 0.2, 1.6, "#stage-1", 0.1);
      S.glideEl(S.L[1] + 3.2, 1.6, "#stage-2", 0.1);
      S.glideEl(S.L[1] + 6.6, 1.8, "#stage-4", 0.1);
      S.at(S.L[2] - 0.3, async () => { await go("/mission?context=moon-base"); await toEl("#step-conditions", 70)(); });
      S.at(S.L[2] + 1.2, () => p.locator('input[type="range"]').first().focus());
      for (let k = 0; k < 10; k++) S.at(S.L[2] + 2.0 + k * 0.17, () => p.keyboard.press("ArrowRight"));
      S.at(S.L[2] + 4.2, fx.sticker("Past the evidence!", 1300, 200));
      S.at(S.L[3] - 0.3, async () => { await go("/challenge"); await toEl("#stage-7", 60)(); });
      S.glideEl(S.L[3] + 2.8, 1.6, "#says-no", 0.22);
      S.at(S.L[4] - 0.3, async () => { await go("/methodology"); await zoom(1.25)(); await heading("Drag a weight and watch", 140)(); });
      [1.25, 1.5, 1.75, 2].forEach((v, k) => S.at(S.L[4] + 0.8 + k * 0.45, () => p.locator('input[type="range"]').first().fill(String(v))));
      S.at(S.L[5] - 0.2, heading("fool the checker", 70));
      S.tap(S.L[5] + 2.0, () => p.getByRole("button", { name: "It gets flagged" }).nth(1), "wrong-number");
      S.tap(S.L[5] + 3.6, () => p.getByRole("button", { name: "It gets flagged" }).nth(1), "moon-claim");
      S.at(S.L[5] + 4.0, fx.sticker("Caught!", 1300, 260));
      S.at(S.L[6] - 0.5, freefallAt(2));
      S.tap(S.L[6] + 0.2, () => btn("Continue mission"), "continue");
      S.tap(S.L[6] + 1.2, () => p.locator(".game-part", { hasText: "Flow duct" }), "duct-preview");
      S.tap(S.L[6] + 1.7, () => p.locator(".game-part", { hasText: "Flow duct" }), "duct-install");
      S.tap(S.L[6] + 2.6, () => btn("Quick build"), "quick");
      S.at(S.L[6] + 3.0, fx.sticker("Built it!", 1250, 300));
    }],

    // 04 HOW: impact, needs, and what it could be one day
    how: [async () => { await go("/mission?context=moon-base"); await toEl("#step-status", 70)(); }, (S) => {
      S.at(0.05, chapter(4, "HOW · IMPACT & NEEDS", "What changes next", "Impact, our needs, and where this goes"));
      S.at(0.4, quad(4));
      S.at(S.L[0] + 2.4, fx.sticker("See the gap first", 1250, 230));
      S.at(S.L[1] - 0.3, async () => { await go("/gaps"); await toEl("#research-planning", 70)(); });
      S.glideEl(S.L[1] + 4.0, 1.8, "#evidence-gain", 0.04);
      S.go(S.L[2] - 0.3, "/mission/brief?o2=34&kpa=56.5&flow=20&g=lunar&m=PMMA");
      S.at(S.L[2] + 3.6, async () => { await go("/sources"); await toEl("#downloads", 90)(); });
      S.at(S.L[3] - 0.2, call("__vpRoad", 1));
      S.at(S.L[3] + 1.6, call("__vpRoad", 2));
      S.at(S.L[3] + 4.0, call("__vpRoad", 3));
      S.at(S.L[4] + 0.3, call("__vpRoad", 4));
    }],

    // the end card
    close: [async () => { await go("/"); await quad(0)(); }, (S) => {
      const end = (st) => call("__voxEnd", st);
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
