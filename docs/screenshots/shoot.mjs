/**
 * High-resolution README screenshots of the real site (2880x1800, phone at 1170x2532).
 * Every screen is reached by playing the site, so each shows a genuine state.
 *
 *   SITE=http://localhost:3417 node shoot.mjs
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

const SITE = process.env.SITE ?? "http://localhost:3417";
const b = await chromium.launch({ headless: true, channel: "chromium", args: ["--use-angle=metal", "--enable-gpu", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"] });
const tips = () => {
  try { // the state after a child presses "Got it" on each crew tip, so tips don't cover the content
    const k = "microfire-explorer-v2", s = JSON.parse(localStorage.getItem(k) || "{}");
    s.tips = ["home", "story", "atlas", "analyze", "compare", "mission", "gaps", "ask", "methodology", "sources", "experiment", "expedition"];
    localStorage.setItem(k, JSON.stringify(s));
  } catch {}
};
const issues = [];

async function session(viewport, scale, run) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: scale, acceptDownloads: true });
  await ctx.addInitScript(tips);
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on("pageerror", (e) => issues.push(String(e).slice(0, 150)));
  const go = async (path) => { await p.goto(SITE + path, { waitUntil: "load", timeout: 45000 }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500); };
  const btn = (name) => p.getByRole("button", { name }).first();
  const click = async (loc) => { try { await loc.first().evaluate((n) => n.click()); } catch (e) { issues.push(String(e).split("\n")[0]); } await p.waitForTimeout(500); };
  const to = async (sel, pad = 90) => { await p.evaluate(([s, pad]) => { const el = document.querySelector(s); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - pad); }, [sel, pad]); await p.waitForTimeout(900); };
  const shot = async (name, wait = 900) => { await p.waitForTimeout(wait); await p.screenshot({ path: `${name}.png` }); console.log("shot", name); };
  await run({ p, go, btn, click, to, shot });
  await ctx.close();
}

// ---- desktop tour ----
await session({ width: 1440, height: 900 }, 2, async ({ p, go, btn, click, to, shot }) => {
  await go("/"); await shot("01-home", 1500);

  await go("/story"); await p.evaluate(() => localStorage.clear()); await go("/story");
  await click(btn("Start the mission")); await p.waitForTimeout(1200);
  await click(p.locator(".game-sheet button.story-cta"));
  await click(btn("Switch off gravity")); await p.waitForTimeout(1500); await click(btn("Recenter")); await shot("02-freefall-gravity", 2600);
  await click(p.locator(".game-sheet button.story-cta"));
  await click(btn("Quick build")); await shot("03-freefall-build", 2200);

  await go("/expedition"); await p.evaluate(() => localStorage.removeItem("microfire-spark-journey-v1")); await go("/expedition");
  await shot("04-expedition-welcome", 1200);
  const next = () => click(btn(/Next discovery|Explore next chapter|See my discoveries/));
  await click(btn(/follow the spark/i));
  await click(p.locator("button", { hasText: "Investigate this flame" }));
  await p.waitForTimeout(1500);
  await click(p.getByRole("button", { name: "Play", exact: true }));
  await click(p.getByRole("tab", { name: "AI vision" }));
  await click(p.locator(".exp-metrics button"));
  await click(p.getByRole("tab", { name: "Measurements" }));
  await p.waitForTimeout(3500);
  await click(p.getByRole("button", { name: "Pause", exact: true }));
  await p.evaluate(() => scrollTo(0, 0)); await shot("05-expedition-vision", 3000);
  await next();
  await click(btn("Outline A")); await click(btn("Outline B")); await shot("06-expedition-trace", 300);
  await p.waitForTimeout(2800); await next();
  await click(btn("Less airflow")); await click(btn("It went out"));
  await p.waitForTimeout(2800); await to('[class*="comparison"]', 150); await shot("07-expedition-predict", 600);
  await next();
  const cands = p.locator('[class*="candidates"] button');
  await click(cands.nth(0)); await click(cands.nth(1)); await shot("08-expedition-moon", 300);
  await p.waitForTimeout(2800); await next();
  await click(btn("We need more evidence for these conditions.")); await p.waitForTimeout(2800); await next();
  await click(btn("What changed between B16, B20 and B19?")); await p.waitForTimeout(4000); await shot("09-expedition-ask-pix", 300);
  await p.waitForTimeout(2600); await next();
  await p.getByLabel(/Nickname/).fill("Ada");
  await to('[class*="debrief"]', 120); await shot("10-expedition-debrief");
  const [dl] = await Promise.all([p.waitForEvent("download"), click(btn(/Save my certificate/))]);
  await dl.saveAs("11-certificate.png");

  await go("/atlas"); await to("#atlas-tool", 70); await shot("12-atlas");
  await go("/experiments/bass2-B19"); await shot("13-test-record");
  await go("/compare?preset=pmma-flow-window"); await to("#compare-tool", 70); await shot("14-compare");
  await go("/mission"); await to("#mission-tool", 70); await shot("15-mission-lab");
  await go("/gaps"); await to("#gaps-tool", 70); await shot("16-evidence-gaps");
  await go("/ask"); await to("#ask-tool", 70);
  await p.getByRole("textbox").first().fill("What happened to thin PMMA at 16.5% oxygen as the airflow changed?");
  await click(btn(/Find the evidence|Ask/)); await p.waitForTimeout(8000); await shot("17-ask");
});

// ---- phone ----
await session({ width: 390, height: 844 }, 3, async ({ p, go, btn, click, shot }) => {
  await go("/expedition"); await shot("18-phone-expedition", 1200);
});
await b.close();

// PNG -> high-quality JPEG (keeps the repo light; 2x pixels are kept)
for (const f of execFileSync("ls", ["."]).toString().split("\n").filter((x) => /^\d\d-.*\.png$/.test(x))) {
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "86", f, "--out", f.replace(".png", ".jpg")], { stdio: "ignore" });
  execFileSync("rm", [f]);
}
console.log(issues.length ? "ISSUES:\n" + issues.join("\n") : "no issues");
