// Recording-only overlay, injected into every page during capture (never shipped with the site):
// Vox-style key-phrase captions, a visible finger cursor with tap ripples, and the opening
// science explainer card (an illustration of Earth vs orbit flames, labelled as such).
(() => {
  const CSS = `
#vox-root{position:fixed;inset:0;pointer-events:none;z-index:2147483647;font-family:var(--font-display,system-ui),system-ui,sans-serif}
#vox-cap{position:absolute;left:72px;bottom:86px;max-width:1100px;transform:rotate(-1.2deg)}
#vox-cap span{display:inline;font-size:52px;line-height:1.32;font-weight:800;color:#121417;background:#ffcc79;padding:4px 18px;box-decoration-break:clone;-webkit-box-decoration-break:clone;box-shadow:0 10px 40px #0008}
#vox-cap.in{animation:voxIn .45s cubic-bezier(.2,.9,.2,1.2) both}
#vox-cap.out{animation:voxOut .3s ease both}
#vox-root.right #vox-cap{left:auto;right:72px;bottom:150px;text-align:right;transform:rotate(1deg)}
#vox-tag{position:absolute;right:28px;bottom:22px;font:600 15px system-ui,sans-serif;color:#d2e7f4;background:#061020cc;padding:7px 12px;border-radius:10px}
#vox-cursor{position:absolute;left:0;top:0;width:34px;height:34px;margin:-6px 0 0 -10px;opacity:0;transition:opacity .3s;filter:drop-shadow(0 4px 10px #000a)}
#vox-cursor.on{opacity:1}
.vox-ripple{position:absolute;width:20px;height:20px;margin:-10px;border-radius:50%;border:4px solid #ffcc79;box-shadow:0 0 24px #ffb23c;animation:voxRipple .7s ease-out both}
#vox-card{position:absolute;left:50%;top:50%;width:1180px;translate:-50% -50%;display:grid;grid-template-columns:1fr 1fr;gap:28px;padding:34px 38px 26px;border-radius:30px;background:#061020e0;border:1px solid #ffcc7966;box-shadow:0 30px 90px #000c;opacity:0;scale:.92;transition:opacity .6s,scale .6s}
#vox-card[data-stage]:not([data-stage=""]){opacity:1;scale:1}
#vox-card .panel{position:relative;transition:opacity .6s,filter .6s}
#vox-card[data-stage=earth] .space{opacity:.12;filter:blur(2px)}
#vox-card[data-stage=space] .earth,#vox-card[data-stage=flow] .earth{opacity:.35;filter:saturate(.4)}
#vox-card h3{margin:0 0 6px;font-size:40px;font-weight:800;color:#fff4df;text-align:center}
#vox-card svg{width:100%;height:auto;display:block}
#vox-card .note{position:absolute;left:0;right:0;bottom:6px;text-align:center;font:700 22px system-ui,sans-serif;color:#cfe3f3}
#vox-card .tag{grid-column:1/-1;text-align:center;font:600 14px system-ui,sans-serif;color:#819cb6}
.v-candle-flame{transform-box:fill-box;transform-origin:50% 100%;animation:flicker .18s ease-in-out infinite alternate}
.v-up{animation:rise 2.2s linear infinite}.v-up:nth-of-type(2){animation-delay:-.73s}.v-up:nth-of-type(3){animation-delay:-1.46s}
.v-in{animation:inflow 2s ease-in-out infinite}
.v-ball{transform-box:fill-box;transform-origin:center;animation:pulse 2.4s ease-in-out infinite}
.v-flow{opacity:0;transition:opacity .6s}#vox-card[data-stage=flow] .v-flow{opacity:1}
.v-flow path{animation:stream 1.6s linear infinite}.v-flow path:nth-child(2){animation-delay:-.5s}.v-flow path:nth-child(3){animation-delay:-1.1s}
.v-norise{opacity:0;transition:opacity .6s .4s}#vox-card[data-stage=space] .v-norise,#vox-card[data-stage=flow] .v-norise{opacity:1}
@keyframes voxIn{from{opacity:0;transform:translateX(-60px) rotate(-1.2deg)}to{opacity:1;transform:rotate(-1.2deg)}}
@keyframes voxOut{to{opacity:0;transform:translateY(16px) rotate(-1.2deg)}}
@keyframes voxRipple{from{scale:.4;opacity:1}to{scale:3.4;opacity:0}}
@keyframes flicker{from{transform:scale(1,1) skewX(-2deg)}to{transform:scale(.94,1.07) skewX(2deg)}}
@keyframes rise{from{transform:translateY(0);opacity:0}20%{opacity:1}to{transform:translateY(-90px);opacity:0}}
@keyframes inflow{0%,100%{transform:translateX(0);opacity:.4}50%{transform:translateX(10px);opacity:1}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
@keyframes stream{from{transform:translateX(-50px);opacity:0}25%{opacity:1}to{transform:translateX(60px);opacity:0}}`;

  const ARROW = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const CARD = `
<div class="panel earth"><h3>On Earth</h3>
<svg viewBox="0 0 300 300"><defs>
 <linearGradient id="vf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3b6cff"/><stop offset=".18" stop-color="#ff8a2a"/><stop offset=".6" stop-color="#ffc24a"/><stop offset="1" stop-color="#fff2b0"/></linearGradient></defs>
 <g class="v-up">${ARROW("M150 92 v-30 m-12 12 l12-12 l12 12", "#ff9a5a")}</g>
 <g class="v-up">${ARROW("M118 100 v-30 m-12 12 l12-12 l12 12", "#ff9a5a")}</g>
 <g class="v-up">${ARROW("M182 100 v-30 m-12 12 l12-12 l12 12", "#ff9a5a")}</g>
 <path class="v-candle-flame" d="M150 210 C124 190 124 150 150 96 C176 150 176 190 150 210Z" fill="url(#vf)"/>
 <rect x="138" y="210" width="24" height="62" rx="4" fill="#efe6d2"/><line x1="150" y1="210" x2="150" y2="198" stroke="#333" stroke-width="3"/>
 <g class="v-in">${ARROW("M60 250 q40 -10 72 -36 m-14 0 l14 0 l-2 14", "#7fd3ff")}</g>
 <g class="v-in">${ARROW("M240 250 q-40 -10 -72 -36 m14 0 l-14 0 l2 14", "#7fd3ff")}</g>
</svg><p class="note">Hot air rises. Fresh air rushes in.</p></div>
<div class="panel space"><h3>In orbit</h3>
<svg viewBox="0 0 300 300"><defs>
 <radialGradient id="vb"><stop offset="0" stop-color="#e6f3ff"/><stop offset=".35" stop-color="#7fb2ff"/><stop offset=".75" stop-color="#3355ff" stop-opacity=".7"/><stop offset="1" stop-color="#2233aa" stop-opacity="0"/></radialGradient></defs>
 <rect x="40" y="186" width="220" height="8" rx="3" fill="#cfd8e6"/>
 <ellipse class="v-ball" cx="160" cy="166" rx="48" ry="38" fill="url(#vb)"/>
 <g class="v-norise"><text x="150" y="70" text-anchor="middle" font-size="22" font-weight="700" fill="#9fb7cc" font-family="system-ui">nothing rises</text>
  ${ARROW("M150 112 v-24", "#56708a")}<line x1="132" y1="84" x2="168" y2="116" stroke="#ff6b6b" stroke-width="5" stroke-linecap="round"/></g>
 <g class="v-flow">${ARROW("M20 150 h60 m-12 -10 l12 10 l-12 10", "#7fd3ff")}${ARROW("M20 186 h60 m-12 -10 l12 10 l-12 10", "#7fd3ff")}${ARROW("M20 222 h60 m-12 -10 l12 10 l-12 10", "#7fd3ff")}</g>
</svg><p class="note">Only moving air feeds the flame.</p></div>
<p class="tag">Illustration of the idea, not a simulation</p>`;

  const mount = () => {
    if (document.getElementById("vox-root")) return;
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.append(st);
    const r = document.createElement("div");
    r.id = "vox-root";
    r.innerHTML = `<div id="vox-card" data-stage="">${CARD}</div><div id="vox-cap"></div><div id="vox-tag">Real site footage · AI voiceover</div>
<svg id="vox-cursor" viewBox="0 0 34 34"><path d="M8 3 L8 26 L14 20 L18 30 L22 28 L18 18 L26 18 Z" fill="#fff" stroke="#121417" stroke-width="2" stroke-linejoin="round"/></svg>`;
    document.body.append(r);
    const cur = r.querySelector("#vox-cursor");
    addEventListener("mousemove", (e) => { cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; cur.classList.add("on"); }, true);
    if (window.__voxCap) window.__vox(window.__voxCap);
  };
  window.__voxPos = (pos) => document.getElementById("vox-root")?.classList.toggle("right", pos === "right");
  window.__vox = (text) => {
    window.__voxCap = text;
    const c = document.getElementById("vox-cap");
    if (!c) return;
    if (!text) { c.className = "out"; return; }
    c.className = "";
    void c.offsetWidth;
    const s = document.createElement("span");
    s.textContent = text;
    c.replaceChildren(s);
    c.className = "in";
  };
  window.__voxTap = (x, y) => {
    const r = document.getElementById("vox-root");
    if (!r) return;
    const d = document.createElement("div");
    d.className = "vox-ripple";
    d.style.left = x + "px";
    d.style.top = y + "px";
    r.append(d);
    setTimeout(() => d.remove(), 800);
  };
  window.__voxCard = (stage) => { const c = document.getElementById("vox-card"); if (c) c.dataset.stage = stage; };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", mount); else mount();
})();
