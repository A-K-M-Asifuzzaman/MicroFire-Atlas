import type { EvidenceRecord } from "@/lib/ontology";

const W = 640, H = 360, L = 56, R = 20, T = 20, B = 48;
const P0 = 50, P1 = 105, O0 = 14, O1 = 36;
const x = (kpa: number) => L + ((kpa - P0) / (P1 - P0)) * (W - L - R);
const y = (o2: number) => H - B - ((o2 - O0) / (O1 - O0)) * (H - T - B);

/**
 * Every test with both pressure and oxygen recorded, on one atmosphere map, with NASA's proposed
 * exploration atmosphere marked. Shows how close (and how far) the evidence gets to habitat air.
 * Server-rendered SVG: attributes only, so the strict CSP holds.
 */
export function AtmosphereMap({ records, target = { kpa: 56.5, o2: 34 } }: { records: EvidenceRecord[]; target?: { kpa: number; o2: number } }) {
  const pts = records.filter((r) => r.pressureKpa && r.oxygen != null);
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Oxygen against pressure for ${pts.length} NASA tests. NASA's proposed exploration atmosphere, ${target.o2} % oxygen at ${target.kpa} kPa, is marked; the closest tests are Saffire VI near 55 kPa and 29 to 31 % oxygen.`}>
        <rect x={L} y={T} width={W - L - R} height={H - T - B} rx="10" fill="#0a1222" stroke="#1e2940" />
        {[60, 70, 80, 90, 100].map((k) => (
          <g key={k}>
            <line x1={x(k)} x2={x(k)} y1={T} y2={H - B} stroke="#1e2940" />
            <text x={x(k)} y={H - B + 18} textAnchor="middle" fill="#8f9ab1" fontSize="12">{k}</text>
          </g>
        ))}
        {[15, 20, 25, 30, 35].map((o) => (
          <g key={o}>
            <line x1={L} x2={W - R} y1={y(o)} y2={y(o)} stroke="#1e2940" />
            <text x={L - 10} y={y(o) + 4} textAnchor="end" fill="#8f9ab1" fontSize="12">{o}</text>
          </g>
        ))}
        <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fill="#8f9ab1" fontSize="12">Pressure, kPa (sea level is about 101)</text>
        <text x={14} y={(T + H - B) / 2} textAnchor="middle" fill="#8f9ab1" fontSize="12" transform={`rotate(-90 14 ${(T + H - B) / 2})`}>Oxygen, %</text>

        {/* target: the proposed exploration atmosphere */}
        <circle cx={x(target.kpa)} cy={y(target.o2)} r="26" fill="#ffcf6b14" stroke="#ffcf6b" strokeDasharray="4 5" />
        <circle cx={x(target.kpa)} cy={y(target.o2)} r="5" fill="#ffcf6b" />
        <text x={x(target.kpa) + 34} y={y(target.o2) + 4} fill="#ffe2ac" fontSize="13" fontWeight="700">Moon-base air ({target.o2} %, {target.kpa} kPa)</text>

        {pts.map((r) => {
          const p = (r.pressureKpa![0] + r.pressureKpa![1]) / 2;
          const saffire = r.family === "saffire";
          return (
            <circle key={r.id} cx={x(p)} cy={y(r.oxygen!)} r={saffire ? 7 : 4.5} fill={saffire ? "#ffcf6b" : "#56d4e4"} fillOpacity={saffire ? 0.95 : 0.55} stroke="#070b16" strokeWidth="1.5">
              <title>{`${r.label}: ${r.oxygen} % O₂ at ${p} kPa`}</title>
            </circle>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        <span><i className="inline-block w-3 h-3 rounded-full bg-[#ffcf6b] align-middle mr-2" />Saffire run</span>
        <span><i className="inline-block w-3 h-3 rounded-full bg-[#56d4e4] opacity-60 align-middle mr-2" />BASS-II test</span>
        <span>Dashed ring: NASA&apos;s proposed exploration atmosphere (a scenario, not a test)</span>
      </figcaption>
    </figure>
  );
}
