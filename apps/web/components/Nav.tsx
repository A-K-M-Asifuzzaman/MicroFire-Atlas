"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useExplorer } from "@/components/guide/EmberGuide";
import { STATIONS, StationIcon } from "@/components/StationMap";

const LINKS = [...STATIONS, { href: "/methodology", label: "Method", icon: "map", title: "How it works", detail: "Check our methods and sources." }];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { gentle, setGentle } = useExplorer();
  const items = LINKS.map((l) => {
    const active = path === l.href || path.startsWith(l.href + "/");
    return (
      <Link
        key={l.href}
        href={l.href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className="station-nav-link"
      >
        <StationIcon name={l.icon} /><span>{l.label}</span>
      </Link>
    );
  });
  const motion = (
    <button
      onClick={() => setGentle(!gentle)}
      aria-pressed={gentle}
      title={gentle ? "Background motion paused" : "Pause background motion"}
      className="nav-motion"
    >
      <span aria-hidden="true">{gentle ? "▶" : "❚❚"}</span>
      <span className="sr-only lg:not-sr-only">{gentle ? "Play motion" : "Pause motion"}</span>
    </button>
  );
  return (
    <nav aria-label="Main" className="station-nav" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <div className="station-nav-desktop">{items}</div>
      {motion}
      <button
        className="station-menu-button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Close" : "Explore"} <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      {open && (
        <div id="mobile-nav" className="station-nav-mobile">
          <p className="display text-xl">Pick your next discovery</p>
          {items}
        </div>
      )}
    </nav>
  );
}
