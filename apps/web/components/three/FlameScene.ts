/**
 * MicroFire Atlas 3D scene (plain three.js, client only).
 *
 * The flame is an ILLUSTRATION driven by a test's recorded conditions and outcome, not a
 * combustion simulation: its colour, size and behaviour encode what NASA wrote down
 * (kept burning, quenched as flow fell, blew off, never ignited).
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type Outcome = "burning" | "quench" | "blowoff" | "dim" | "none";

export type CloudPoint = { id: string; label: string; x: number; y: number; z: number; color: string; hollow?: boolean };

export type SceneState = {
  view: "bench" | "duct" | "cloud";
  gravity: "earth" | "orbit";
  /** Oxygen, vol %: drives flame brightness. */
  o2: number;
  /** Airflow, cm/s: drives drift and streak speed. */
  flow: number;
  outcome: Outcome;
  material?: "PMMA" | "fabric";
  cloud?: CloudPoint[];
  highlight?: string[];
  /** Show an empty "no data" region in the cloud (e.g. 34 % O2). */
  voidRegion?: { y: number; label: string } | null;
};

const N = 2600;

const VERT = /* glsl */ `
attribute float aSize;
attribute vec4 aColor;
varying vec4 vColor;
uniform float uScale;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
varying vec4 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor.rgb, vColor.a * a * a);
}`;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function textSprite(text: string, color = "#e6eaf2", size = 44, weight = 600) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = `${weight} ${size}px Archivo, system-ui, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 16;
  c.width = w;
  c.height = size + 16;
  ctx.font = `${weight} ${size}px Archivo, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 8, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(w / 200, c.height / 200, 1);
  return s;
}

export class FlameScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clock = new THREE.Clock();
  private raf = 0;
  private running = true;
  private reduced: boolean;

  private state: SceneState;
  // smoothed parameters
  private p = { grav: 1, o2: 21, flow: 5, life: 1, lift: 0, blue: 0, cloud: 0, gust: 0 };

  private duct = new THREE.Group();
  private bench = new THREE.Group();
  private flameGroup = new THREE.Group();
  private cloudGroup = new THREE.Group();
  private sample!: THREE.Mesh;
  private glow!: THREE.Sprite;
  private light!: THREE.PointLight;

  private pos = new Float32Array(N * 3);
  private vel = new Float32Array(N * 3);
  private col = new Float32Array(N * 4);
  private size = new Float32Array(N);
  private age = new Float32Array(N);
  private life = new Float32Array(N);
  private geo = new THREE.BufferGeometry();
  private next = 0;

  private streaks!: THREE.LineSegments;
  private streakPos = new Float32Array(160 * 6);
  private cloudMeshes = new Map<string, { mesh: THREE.Mesh; label: THREE.Sprite }>();
  private voidBox: THREE.Group | null = null;
  private fadeIn = 1;

  constructor(private canvas: HTMLCanvasElement, initial: SceneState, opts: { compact?: boolean } = {}) {
    this.state = initial;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    if (opts.compact) this.camera.position.set(3.4, 1.7, 5.6);
    else this.camera.position.set(5.5, 2.6, 8.5);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.autoRotate = !this.reduced;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.target.set(0, 0.2, 0);

    this.scene.add(new THREE.AmbientLight(0x8fa3c8, 0.6));
    const key = new THREE.DirectionalLight(0xbfd2ff, 0.8);
    key.position.set(4, 6, 5);
    this.scene.add(key);

    this.buildDuct();
    if (opts.compact) this.duct.children.filter((c) => (c as THREE.Sprite).isSprite).forEach((c) => (c.visible = false)); // caption explains instead
    this.buildBench();
    this.buildFlame();
    this.buildStreaks();
    this.scene.add(this.duct, this.bench, this.flameGroup, this.cloudGroup);

    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.setState(initial, true);
    this.loop();
  }

  /* ---------------- construction ---------------- */

  private buildDuct() {
    // BASS flow duct: square cross-section, roughly 2.2× longer than wide (7.6 cm × 17 cm test section).
    const box = new THREE.BoxGeometry(8, 3.6, 3.6);
    const glass = new THREE.Mesh(box, new THREE.MeshPhysicalMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.06, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: 0x56d4e4, transparent: true, opacity: 0.55 }));
    this.duct.add(glass, edges);
    // flow straightener at the inlet
    const grid = new THREE.Group();
    for (let i = -3; i <= 3; i++) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.02, 3.4, 0.02), new THREE.MeshBasicMaterial({ color: 0x2c3a58 }));
      v.position.set(-4, 0, i * 0.5);
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 3.4), new THREE.MeshBasicMaterial({ color: 0x2c3a58 }));
      h.position.set(-4, i * 0.5, 0);
      grid.add(v, h);
    }
    this.duct.add(grid);
    const label = textSprite("BASS-II flow duct, ISS glovebox (illustration)", "#8f9ab1", 30, 500);
    label.position.set(0, 2.25, 0);
    this.duct.add(label);
  }

  private buildBench() {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.08, 64), new THREE.MeshStandardMaterial({ color: 0x121b30, roughness: 0.9 }));
    plate.position.y = -0.9;
    this.bench.add(plate);
    const label = textSprite("On Earth (illustration)", "#8f9ab1", 30, 500);
    label.position.set(0, 2.4, 0);
    this.bench.add(label);
  }

  private buildFlame() {
    this.sample = new THREE.Mesh(new THREE.BoxGeometry(5, 0.04, 1.1), new THREE.MeshStandardMaterial({ color: 0xc9d1e3, roughness: 0.5, transparent: true, opacity: 0.85 }));
    this.sample.position.set(0.3, -0.6, 0);
    this.flameGroup.add(this.sample);

    this.geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aColor", new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uScale: { value: 300 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(this.geo, mat);
    pts.frustumCulled = false;
    this.flameGroup.add(pts);

    const g = document.createElement("canvas");
    g.width = g.height = 128;
    const ctx = g.getContext("2d")!;
    const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(g), color: 0xf0a044, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
    this.glow.scale.set(1.6, 1.6, 1);
    this.flameGroup.add(this.glow);
    this.light = new THREE.PointLight(0xf0a044, 4, 8, 1.6);
    this.flameGroup.add(this.light);
    for (let i = 0; i < N; i++) this.age[i] = this.life[i] = 1;
  }

  private buildStreaks() {
    const g = new THREE.BufferGeometry();
    for (let i = 0; i < 160; i++) {
      const y = rand(-1.6, 1.6), z = rand(-1.6, 1.6), x = rand(-3.9, 3.9);
      this.streakPos.set([x, y, z, x + 0.3, y, z], i * 6);
    }
    g.setAttribute("position", new THREE.BufferAttribute(this.streakPos, 3).setUsage(THREE.DynamicDrawUsage));
    this.streaks = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x56d4e4, transparent: true, opacity: 0.35 }));
    this.duct.add(this.streaks);
  }

  private buildCloud(points: CloudPoint[]) {
    this.cloudGroup.clear();
    this.cloudMeshes.clear();
    const axis = (from: THREE.Vector3, to: THREE.Vector3) => {
      const g = new THREE.BufferGeometry().setFromPoints([from, to]);
      this.cloudGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x2c3a58 })));
    };
    axis(new THREE.Vector3(-4, -2, -2), new THREE.Vector3(4, -2, -2));
    axis(new THREE.Vector3(-4, -2, -2), new THREE.Vector3(-4, 2.4, -2));
    axis(new THREE.Vector3(-4, -2, -2), new THREE.Vector3(-4, -2, 2));
    const lx = textSprite("Airflow (log) →", "#8f9ab1", 30, 500);
    lx.position.set(3.2, -2.35, -2);
    const ly = textSprite("Oxygen ↑", "#8f9ab1", 30, 500);
    ly.position.set(-4, 2.7, -2);
    const lz = textSprite("Material: PMMA, fabric, Nomex", "#8f9ab1", 26, 500);
    lz.position.set(-4, -2.4, 1.6);
    this.cloudGroup.add(lx, ly, lz);
    const sphere = new THREE.SphereGeometry(1, 20, 16);
    for (const p of points) {
      const mat = new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: p.hollow ? 0.25 : 0.7, transparent: true, opacity: p.hollow ? 0.45 : 0.95, wireframe: !!p.hollow });
      const mesh = new THREE.Mesh(sphere, mat);
      mesh.position.set(p.x, p.y, p.z);
      mesh.scale.setScalar(0.09);
      const label = textSprite(p.label, "#ffffff", 40, 700);
      label.position.set(p.x, p.y + 0.45, p.z);
      label.visible = false;
      this.cloudGroup.add(mesh, label);
      this.cloudMeshes.set(p.id, { mesh, label });
    }
  }

  private setVoid(v: SceneState["voidRegion"]) {
    if (this.voidBox) this.cloudGroup.remove(this.voidBox);
    this.voidBox = null;
    if (!v) return;
    const g = new THREE.Group();
    const geo = new THREE.BoxGeometry(8, 0.9, 4);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineDashedMaterial({ color: 0xf0a044, dashSize: 0.15, gapSize: 0.12 })));
    (g.children[0] as THREE.LineSegments).computeLineDistances();
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xf0a044, transparent: true, opacity: 0.05, depthWrite: false })));
    const label = textSprite(v.label, "#f0a044", 40, 700);
    label.position.set(0, 0.8, 0);
    g.add(label);
    g.position.set(0, v.y, 0);
    this.voidBox = g;
    this.cloudGroup.add(g);
  }

  /* ---------------- state ---------------- */

  setState(s: SceneState, immediate = false) {
    const prevCloud = this.state.cloud;
    if (s.view !== this.state.view && !immediate) this.fadeIn = 0; // quick cut between views
    this.state = s;
    if (s.cloud && (s.cloud !== prevCloud || this.cloudMeshes.size === 0)) this.buildCloud(s.cloud);
    if (s.view === "cloud") this.setVoid(s.voidRegion ?? null);
    const hi = new Set(s.highlight ?? []);
    for (const [id, { mesh, label }] of this.cloudMeshes) {
      const on = hi.has(id);
      mesh.scale.setScalar(on ? 0.2 : hi.size ? 0.07 : 0.09);
      (mesh.material as THREE.MeshStandardMaterial).opacity = hi.size && !on ? 0.25 : 0.95;
      label.visible = on;
    }
    (this.sample.material as THREE.MeshStandardMaterial).color.set(s.material === "fabric" ? 0xb9a98c : 0xc9d1e3);
    if (s.outcome !== "quench" && s.outcome !== "blowoff") this.p.lift = 0;
    if (immediate) {
      this.p.grav = s.gravity === "earth" ? 1 : 0;
      this.p.o2 = s.o2;
      this.p.flow = s.flow;
      this.p.cloud = s.view === "cloud" ? 1 : 0;
      this.p.life = s.outcome === "none" ? 0 : 1;
    } else if (s.outcome === "burning" || s.outcome === "dim") {
      this.p.life = Math.max(this.p.life, 0.3);
    }
  }

  /** A sudden gust of ventilation: NASA warns a small flame may flare up. */
  gust() {
    this.p.gust = 1;
  }

  /* ---------------- frame ---------------- */

  private spawn(i: number, s: SceneState) {
    const p = this.p;
    const front = this.sample.position.x - 1.2 + p.lift * 3.5;
    const z = rand(-0.5, 0.5);
    this.pos.set([front + rand(-0.15, 0.15), this.sample.position.y + 0.04 + p.lift * 0.4, z], i * 3);
    const strength = 0.5 + (p.o2 - 14) / 14; // brighter with more oxygen
    const earthUp = rand(1.4, 2.4) * strength;
    const theta = rand(0, Math.PI * 2), phi = rand(0, Math.PI);
    const r = rand(0.12, 0.32) * strength;
    const ox = Math.sin(phi) * Math.cos(theta) * r, oy = Math.abs(Math.cos(phi)) * r * 0.9 + 0.05, oz = Math.sin(phi) * Math.sin(theta) * r;
    const drift = p.flow * 0.035 * (s.view === "duct" ? 1 : 0.2);
    this.vel.set([lerp(ox, rand(-0.15, 0.15), p.grav) + drift * (1 - p.grav), lerp(oy, earthUp, p.grav), lerp(oz, rand(-0.15, 0.15), p.grav)], i * 3);
    this.age[i] = 0;
    this.life[i] = lerp(rand(1.2, 2.2), rand(0.6, 1.1), p.grav) * (1 + p.gust * 0.6);
    this.size[i] = rand(0.12, 0.28) * (0.6 + strength * 0.5) * (1 + p.gust * 0.8); // world units
  }

  private step(dt: number) {
    const s = this.state, p = this.p, k = 1 - Math.exp(-dt * 2.2);
    p.grav = lerp(p.grav, s.gravity === "earth" ? 1 : 0, k);
    p.o2 = lerp(p.o2, s.o2, k);
    p.flow = lerp(p.flow, s.flow, k);
    p.cloud = lerp(p.cloud, s.view === "cloud" ? 1 : 0, k);
    p.blue = lerp(p.blue, s.outcome === "dim" || s.outcome === "quench" ? 1 : s.gravity === "orbit" ? 0.55 : 0, k * 0.6);
    p.gust = Math.max(0, p.gust - dt * 0.5);
    const targetLife = s.outcome === "none" ? 0 : s.outcome === "quench" ? 0 : s.outcome === "blowoff" ? 0 : 1;
    p.life = lerp(p.life, targetLife, s.outcome === "quench" ? dt * 0.35 : s.outcome === "blowoff" ? dt * 0.8 : k);
    if (s.outcome === "blowoff") p.lift = Math.min(1, p.lift + dt * 0.45);

    // views
    this.duct.visible = s.view === "duct";
    this.bench.visible = s.view === "bench";
    this.flameGroup.visible = s.view !== "cloud";
    this.cloudGroup.visible = s.view === "cloud";
    if (this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + dt * 2.5);
      this.canvas.style.opacity = String(this.fadeIn); // CSSOM, allowed by the strict CSP
    }

    // spawn
    const rate = (s.view === "cloud" ? 0 : 900) * p.life * (s.outcome === "dim" ? 0.35 : 1) * (1 + p.gust * 1.5);
    let n = rate * dt;
    while (n > 0 && (n >= 1 || Math.random() < n)) {
      this.spawn(this.next, s);
      this.next = (this.next + 1) % N;
      n -= 1;
    }
    // integrate + colour
    const hot = new THREE.Color(0xfff1c4), mid = new THREE.Color(0xf0a044), red = new THREE.Color(0x8a2a12), blue = new THREE.Color(0x5b8cff), core = new THREE.Color(0xbfd2ff);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      if (this.age[i] >= this.life[i]) {
        this.col[i * 4 + 3] = 0;
        continue;
      }
      this.age[i] += dt;
      const t = this.age[i] / this.life[i];
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      // earth: plume narrows as it rises
      this.pos[i * 3 + 2] *= 1 - dt * 1.2 * p.grav;
      // flame colour: hot core -> amber -> dark red; orbit and near-limit flames shift to blue
      if (t < 0.3) c.copy(hot).lerp(mid, t / 0.3);
      else c.copy(mid).lerp(red, (t - 0.3) / 0.7);
      const b = p.blue * (1 - p.gust * 0.8);
      if (b > 0) c.lerp(t < 0.4 ? core : blue, b);
      const a = Math.sin(Math.PI * Math.min(1, t * 1.1)) * (0.35 + 0.25 * (1 - b)) * (0.4 + 0.6 * p.life);
      this.col.set([c.r, c.g, c.b, a], i * 4);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aColor.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;

    const fx = this.sample.position.x - 1.2 + p.lift * 3.5;
    this.glow.position.set(fx, -0.1 + p.grav * 0.5, 0);
    (this.glow.material as THREE.SpriteMaterial).color.set(0xf0a044).lerp(new THREE.Color(0x5b8cff), p.blue);
    (this.glow.material as THREE.SpriteMaterial).opacity = 0.28 * p.life * (1 + p.gust);
    this.light.position.copy(this.glow.position);
    this.light.intensity = 5 * p.life * (1 + p.gust);
    this.light.color.copy((this.glow.material as THREE.SpriteMaterial).color);

    // airflow streaks
    const sp = p.flow * 0.12;
    (this.streaks.material as THREE.LineBasicMaterial).opacity = Math.min(0.5, p.flow / 12) * (s.view === "duct" ? 1 : 0);
    for (let i = 0; i < 160; i++) {
      let x = this.streakPos[i * 6] + sp * dt * 8;
      if (x > 3.9) x = -3.9;
      this.streakPos[i * 6] = x;
      this.streakPos[i * 6 + 3] = x + 0.12 + sp * 0.08;
    }
    this.streaks.geometry.attributes.position.needsUpdate = true;

    // camera framing
    const camTarget = s.view === "cloud" ? new THREE.Vector3(0, s.voidRegion ? 1.2 : 0.2, 0) : new THREE.Vector3(0, s.view === "bench" ? 0.4 : 0, 0);
    this.controls.target.lerp(camTarget, k);
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.running) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    this.step(this.reduced ? dt * 0.5 : dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // pixels per world unit at distance 1: particle size stays physical under perspective
    const scale = h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
    (((this.flameGroup.children[1] as THREE.Points).material as THREE.ShaderMaterial).uniforms.uScale.value) = scale;
  }

  setRunning(on: boolean) {
    this.running = on;
    if (on) this.clock.getDelta();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.controls.dispose();
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
  }
}
