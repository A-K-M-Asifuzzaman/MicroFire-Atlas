// Recording-only overlay for the 240-second pitch, injected after ../explorer/overlay.js.
// Adds the WHO / WHY / WHAT / HOW progress ring (the Space Apps "240 Seconds of Glory" model),
// the team card, the Apollo 1 memorial card, counting statistics and the roadmap.
(() => {
  const CSS = `
#vp-quad{position:absolute;right:34px;top:30px;width:190px;height:190px;opacity:0;transition:opacity .6s;filter:drop-shadow(0 10px 30px #000a)}
#vp-quad.on{opacity:1}
#vp-quad .seg{fill:none;stroke-width:13;stroke-linecap:round;opacity:.22;transition:opacity .5s,stroke-width .5s}
#vp-quad .seg.on{opacity:1;stroke-width:17;animation:vp-pulse 1.6s ease-in-out infinite alternate}
#vp-quad .seg.done{opacity:.6}
#vp-quad text{font:800 15px system-ui,sans-serif;letter-spacing:.08em;fill:#ffffff55;transition:fill .5s}
#vp-quad text.on{fill:#fff}
#vp-quad .hub{fill:#0b1530e6;stroke:#ffffff22}
#vp-quad .min{font:800 30px system-ui,sans-serif;fill:#fff4df;letter-spacing:0}
#vp-quad .mlab{font:700 11px system-ui,sans-serif;fill:#8eeaf5;letter-spacing:.2em}
@keyframes vp-pulse{to{filter:drop-shadow(0 0 10px currentColor)}}

.vp-full{position:absolute;inset:0;opacity:0;transition:opacity .8s ease;background:radial-gradient(ellipse at 50% 30%,#14285a 0%,#071229 55%,#02050c 100%);display:grid;place-content:center;justify-items:center;text-align:center;color:#fff}
.vp-full.on{opacity:1}
.vp-kicker{font:800 20px system-ui,sans-serif;letter-spacing:.32em;color:#8eeaf5}
.vp-full h2{margin-top:14px;font-size:74px;line-height:1.05;font-weight:800;letter-spacing:-.01em}

/* team */
#vp-team .event{margin-top:12px;font-size:30px;font-weight:600;color:#ffe2ac}
#vp-team .members{display:flex;gap:30px;justify-content:center;margin-top:40px}
#vp-team .m{display:grid;justify-items:center;align-content:start;gap:8px;width:250px;opacity:0}
#vp-team.s1 .m{animation:vp-pop .7s cubic-bezier(.2,1.5,.4,1) both}
#vp-team .m img,#vp-team .m .ph{width:160px;height:160px;border-radius:50%;object-fit:cover;border:5px solid #ffcc79;box-shadow:0 0 0 8px #ffcc7922,0 20px 50px #000a;background:#1a2a50;display:grid;place-items:center;font-size:64px;font-weight:800;color:#ffcc79}
#vp-team .m b{font-size:25px;line-height:1.15;font-weight:800}
#vp-team .m span{font:600 20px system-ui,sans-serif;color:#9fd8e6}
#vp-team .promises{display:flex;gap:26px;margin-top:44px}
#vp-team .p{width:470px;padding:26px 28px;border-radius:26px;background:#0d1d3ce6;border:2px solid #ffffff1c;text-align:left;opacity:0;transform:translateY(40px)}
#vp-team .p i{display:block;font-style:normal;font:800 18px system-ui,sans-serif;letter-spacing:.2em;margin-bottom:8px}
#vp-team .p b{display:block;font-size:36px;line-height:1.1;font-weight:800}
#vp-team .p span{display:block;margin-top:10px;font:600 21px system-ui,sans-serif;color:#b9cde0}
#vp-team .p.p1{border-color:#9be35a88}#vp-team .p.p1 i{color:#9be35a}
#vp-team .p.p2{border-color:#3fb5ff88}#vp-team .p.p2 i{color:#3fb5ff}
#vp-team .p.p3{border-color:#ffcc7988}#vp-team .p.p3 i{color:#ffcc79}
#vp-team.s2 .p1,#vp-team.s3 .p2,#vp-team.s4 .p3{animation:vp-rise .8s cubic-bezier(.2,1.2,.3,1) both}

/* memorial */
#vp-mem{background:radial-gradient(ellipse at 50% 45%,#141414 0%,#050505 70%)}
#vp-mem .date{font:700 22px system-ui,sans-serif;letter-spacing:.34em;color:#c9b38a;opacity:0}
#vp-mem.on .date{animation:vp-fade 1.6s .3s both}
#vp-mem h2{font-size:96px;color:#f3ead8;opacity:0}
#vp-mem.on h2{animation:vp-fade 1.8s .8s both}
#vp-mem .names{margin-top:26px;font-size:34px;font-weight:600;color:#d8cdb6;opacity:0;letter-spacing:.01em}
#vp-mem.on .names{animation:vp-fade 1.8s 1.6s both}
#vp-mem .line{margin-top:30px;font:500 24px system-ui,sans-serif;color:#9a8f7c;opacity:0}
#vp-mem.on .line{animation:vp-fade 1.8s 2.4s both}
#vp-mem .glow{width:10px;height:10px;border-radius:50%;margin:0 auto 34px;background:#ffdca0;box-shadow:0 0 30px 14px #ffb34766,0 0 90px 40px #ff8a2a22;opacity:0}
#vp-mem.on .glow{animation:vp-fade 2s both,vp-flick 2.2s 2s ease-in-out infinite alternate}

/* stats */
#vp-stats .row{display:flex;gap:40px;margin-top:40px}
#vp-stats .st{width:330px;padding:30px 20px;border-radius:28px;background:#0d1d3ce6;border:2px solid #8eeaf544;opacity:0}
#vp-stats.s1 .st{animation:vp-pop .7s cubic-bezier(.2,1.4,.4,1) both}
#vp-stats .st b{display:block;font-size:120px;line-height:1;font-weight:800;color:#b8f6fc;font-variant-numeric:tabular-nums}
#vp-stats .st span{display:block;margin-top:10px;font:700 24px system-ui,sans-serif;color:#cfe3f3}
#vp-stats .zero{margin-top:46px;display:flex;align-items:center;gap:34px;padding:22px 46px;border-radius:30px;border:4px dashed #ff8a5a;background:#ff8a5a14;opacity:0}
#vp-stats.s2 .zero{animation:vp-slam .6s cubic-bezier(.2,1.6,.4,1) both,vp-shake .5s .6s both}
#vp-stats .zero b{font-size:150px;line-height:1;font-weight:800;color:#ffb08a}
#vp-stats .zero span{text-align:left;font-size:42px;line-height:1.15;font-weight:800;color:#ffe2d2}
#vp-stats .zero small{display:block;font:600 22px system-ui,sans-serif;color:#d9b8a6;margin-top:6px}

/* roadmap */
#vp-road .track{position:relative;width:1580px;height:420px;margin-top:40px}
#vp-road svg{position:absolute;inset:0;overflow:visible}
#vp-road .path{fill:none;stroke:url(#vp-grad);stroke-width:7;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)}
/* the line grows node by node: nodes sit at 0, 1/3, 2/3 and the end of the path */
#vp-road.s1 .path{stroke-dashoffset:.97}#vp-road.s2 .path{stroke-dashoffset:.667}#vp-road.s3 .path{stroke-dashoffset:.333}#vp-road.s4 .path{stroke-dashoffset:0}
#vp-road .node{position:absolute;top:110px;width:330px;translate:-50% 0;display:grid;justify-items:center;gap:12px;opacity:0}
#vp-road .node .dot{width:46px;height:46px;border-radius:50%;border:6px solid #fff;box-shadow:0 0 30px currentColor}
#vp-road .node i{font-style:normal;font:800 20px system-ui,sans-serif;letter-spacing:.24em}
#vp-road .node b{font-size:30px;line-height:1.18;font-weight:800;color:#fff}
#vp-road .n1{left:8%;color:#9be35a}#vp-road .n2{left:36%;color:#3fb5ff}#vp-road .n3{left:64%;color:#a066ff}#vp-road .n4{left:92%;color:#ff5a4a}
#vp-road .node .dot{background:currentColor}
#vp-road.s1 .n1,#vp-road.s2 .n2,#vp-road.s3 .n3,#vp-road.s4 .n4{animation:vp-pop .7s cubic-bezier(.2,1.5,.4,1) both}
#vp-road.s4 .n4 .dot{animation:vp-beacon 1.4s ease-in-out .7s infinite alternate}

@keyframes vp-pop{from{opacity:0;transform:scale(.5) translateY(30px)}to{opacity:1;transform:none}}
@keyframes vp-rise{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes vp-fade{from{opacity:0;filter:blur(6px)}to{opacity:1;filter:none}}
@keyframes vp-flick{to{transform:scale(1.25);opacity:.85}}
@keyframes vp-slam{from{opacity:0;transform:scale(2.2)}to{opacity:1;transform:none}}
@keyframes vp-shake{0%,100%{translate:0}20%{translate:-14px}40%{translate:12px}60%{translate:-8px}80%{translate:5px}}
@keyframes vp-draw{to{stroke-dashoffset:0}}
@keyframes vp-beacon{to{box-shadow:0 0 70px 20px currentColor}}`;

  const root = () => document.getElementById("vox-root");
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const ensure = () => {
    const r = root();
    if (!r || r.dataset.vp) return r;
    r.dataset.vp = "1";
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.append(st);
    return r;
  };
  const full = (id, html) => {
    const r = ensure();
    if (!r) return null;
    let e = document.getElementById(id);
    if (!e) { e = document.createElement("div"); e.id = id; e.className = "vp-full"; e.innerHTML = html(); r.append(e); }
    return e;
  };
  /** Cumulative stages, like the end card: stage n turns on classes s1..sn; 0 fades the card out. */
  const stage = (e, n) => {
    if (!e) return;
    if (!n) { e.classList.remove("on"); return; }
    e.classList.add("on");
    for (let i = 1; i <= n; i++) e.classList.add("s" + i);
  };

  // WHO / WHY / WHAT / HOW progress ring, colours from the Space Apps guide (01 green, 02 blue, 03 purple, 04 red)
  const Q = [["WHO", "#9be35a"], ["WHY", "#3fb5ff"], ["WHAT", "#a066ff"], ["HOW", "#ff5a4a"]];
  const arc = (k) => {
    const a0 = (-90 + k * 90 + 7) * Math.PI / 180, a1 = (-90 + (k + 1) * 90 - 7) * Math.PI / 180, R = 80;
    return `M ${95 + R * Math.cos(a0)} ${95 + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${95 + R * Math.cos(a1)} ${95 + R * Math.sin(a1)}`;
  };
  const lab = [[132, 52], [140, 146], [52, 146], [46, 52]];
  window.__vpQuad = (n) => {
    try { sessionStorage.setItem("vpQuad", String(n)); } catch {}
    const r = ensure();
    if (!r) return;
    let q = document.getElementById("vp-quad");
    if (!q) {
      q = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      q.id = "vp-quad"; q.setAttribute("viewBox", "0 0 190 190");
      q.innerHTML = Q.map(([, c], k) => `<path class="seg" d="${arc(k)}" stroke="${c}" color="${c}"/>`).join("")
        + `<circle class="hub" cx="95" cy="95" r="52"/><text class="min" x="95" y="100" text-anchor="middle"></text><text class="mlab" x="95" y="121" text-anchor="middle">MINUTE</text>`
        + Q.map(([w], k) => `<text class="lab" x="${lab[k][0]}" y="${lab[k][1]}" text-anchor="middle">${w}</text>`).join("");
      r.append(q);
    }
    q.classList.toggle("on", n > 0);
    q.querySelectorAll(".seg").forEach((s, k) => { s.classList.toggle("on", k === n - 1); s.classList.toggle("done", k < n - 1); });
    q.querySelectorAll(".lab").forEach((t, k) => t.classList.toggle("on", k === n - 1));
    q.querySelector(".min").textContent = n > 0 ? String(n) : "";
  };

  window.__vpTeam = (n) => stage(full("vp-team", () => {
    const T = window.__TEAM ?? {};
    const members = (T.members ?? []).map((m, i) => `<div class="m" style="animation-delay:${(0.15 + i * 0.13).toFixed(2)}s">${m.photo ? `<img src="${esc(m.photo)}" alt="">` : `<div class="ph">${esc((m.name || "?").trim()[0])}</div>`}<b>${esc(m.name)}</b><span>${esc(m.role)}</span></div>`).join("");
    return `<div class="vp-kicker">01 · WHO WE ARE</div><h2>${esc(T.name ?? "Our team")}</h2><div class="event">${esc(T.event ?? "NASA Space Apps Challenge 2026 · Flame in Freefall")}</div>
${members ? `<div class="members">${members}</div>` : ""}
<div class="promises"><div class="p p1"><i>PROMISE 1</i><b>Never fake a number</b><span>Every value traced to the exact page of a NASA report</span></div>
<div class="p p2"><i>PROMISE 2</i><b>Build for everyone</b><span>The mission planner, and the kid who may live on the Moon</span></div>
<div class="p p3"><i>PROMISE 3</i><b>Show where evidence stops</b><span>A gap is a result, not a failure</span></div></div>`;
  }), n);

  window.__vpMemorial = (n) => stage(full("vp-mem", () => `<div class="glow"></div><div class="date">JANUARY 27, 1967 · LAUNCH COMPLEX 34</div><h2>Apollo 1</h2>
<div class="names">Virgil “Gus” Grissom · Edward H. White II · Roger B. Chaffee</div><div class="line">A fire in a pure-oxygen cabin, during a test on the launch pad.</div>`), n);

  window.__vpStats = (n) => {
    const e = full("vp-stats", () => `<div class="vp-kicker">02 · THE KILLER DATA POINT</div><h2>What NASA has tested, in one place</h2>
<div class="row"><div class="st"><b data-to="78">0</b><span>NASA test records</span></div><div class="st"><b data-to="62">0</b><span>verified NASA findings</span></div><div class="st"><b data-to="19">0</b><span>NASA sources</span></div></div>
<div class="zero"><b>0</b><span>tests at 34 % oxygen<small>the exploration atmosphere NASA has studied</small></span></div>`);
    stage(e, n);
    if (n === 1 && e && !e.dataset.counted) {
      e.dataset.counted = "1";
      const t0 = performance.now();
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / 1600), ease = 1 - (1 - k) ** 3;
        e.querySelectorAll("b[data-to]").forEach((b) => { b.textContent = String(Math.round(+b.dataset.to * ease)); });
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  };

  window.__vpRoad = (n) => stage(full("vp-road", () => `<div class="vp-kicker">04 · WHERE THIS GOES</div><h2>From one atlas to a living evidence map</h2>
<div class="track"><svg viewBox="0 0 1580 420"><defs><linearGradient id="vp-grad"><stop offset="0" stop-color="#9be35a"/><stop offset=".35" stop-color="#3fb5ff"/><stop offset=".65" stop-color="#a066ff"/><stop offset="1" stop-color="#ff5a4a"/></linearGradient></defs>
<path class="path" pathLength="1" d="M 126 133 C 400 40, 450 230, 569 133 S 900 40, 1011 133 S 1300 230, 1454 133"/></svg>
<div class="node n1"><div class="dot"></div><i>TODAY</i><b>78 records · 62 findings · checked AI</b></div>
<div class="node n2"><div class="dot"></div><i>NEXT</i><b>Fire scientists review our labels</b></div>
<div class="node n3"><div class="dot"></div><i>THEN</i><b>People annotate real flame frames</b></div>
<div class="node n4"><div class="dot"></div><i>ONE DAY</i><b>Every new NASA fire test plugs in, Moon burns included</b></div></div>`), n);

  // the progress ring survives page navigations within a scene
  const restore = () => { try { const v = +(sessionStorage.getItem("vpQuad") ?? 0); if (v) window.__vpQuad(v); } catch {} };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", () => setTimeout(restore, 0)); else setTimeout(restore, 0);
})();
