"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useExplorer } from "@/components/guide/EmberGuide";
import { DISCOVERIES } from "@/lib/guide";

const Y = (y: number) => 6 + y * 0.48; // discovery box (0-100) into the 100 x 56 map

/**
 * The evidence constellation: one star per discovery, in journey order. Lit stars are things the
 * child actually did; every star opens a real route or NASA record. The list below is the same map
 * for keyboards, screen readers and small screens.
 */
export function EvidenceConstellation({ compact = false }: { compact?: boolean }) {
  const { found } = useExplorer();
  const router = useRouter();
  const lit = new Set(found);
  return (
    <div>
      <svg viewBox="0 0 100 56" className="const-map" role="img" aria-label={`Evidence map: ${found.length} of ${DISCOVERIES.length} discoveries found`}>
        {DISCOVERIES.slice(1).map((d, i) => {
          const a = DISCOVERIES[i];
          const on = lit.has(a.id) && lit.has(d.id);
          return <line key={d.id} x1={a.x} y1={Y(a.y)} x2={d.x} y2={Y(d.y)} className={on ? "const-line-on" : "const-line"} />;
        })}
        {DISCOVERIES.map((d) => {
          const on = lit.has(d.id);
          return (
            <a
              key={d.id}
              href={d.href}
              className={`const-node ${on ? "const-node-on" : ""} const-${d.kind}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(d.href);
              }}
            >
              <title>{`${d.label}${on ? " (found)" : " (not found yet)"}`}</title>
              <circle cx={d.x} cy={Y(d.y)} r={on ? 3.4 : 2.6} className="const-halo" />
              <circle cx={d.x} cy={Y(d.y)} r={on ? 1.5 : 1.1} className="const-core" />
              {d.kind === "gap" && (
                <text x={d.x} y={Y(d.y) + 0.9} textAnchor="middle" className="const-q">?</text>
              )}
              {!compact && (
                <text x={d.x} y={Y(d.y) + (d.y > 50 ? 5.6 : -4)} textAnchor={d.x > 85 ? "end" : d.x < 12 ? "start" : "middle"} className="const-label">
                  {d.label}
                </text>
              )}
            </a>
          );
        })}
      </svg>
      <ol className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 text-[15px]">
        {DISCOVERIES.map((d) => (
          <li key={d.id} className="flex items-baseline gap-2">
            <span aria-hidden="true" className={lit.has(d.id) ? "text-flame" : "text-faint"}>{lit.has(d.id) ? "★" : "☆"}</span>
            <Link href={d.href} className={lit.has(d.id) ? "link" : "text-muted hover:text-ink"}>
              {d.label}
            </Link>
            <span className="sr-only">{lit.has(d.id) ? "found" : "not found yet"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
