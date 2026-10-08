"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { NAV_GROUPS, StationIcon } from "@/components/StationMap";

const destinations = [
  { href: "/", label: "Command center", title: "MicroFire Atlas", detail: "Return to mission control", icon: "orbit", group: "Station" },
  { href: "/challenge", label: "Challenge Mode", title: "One question, nine evidence steps", detail: "The judge-ready mission challenge", icon: "rocket", group: "Priority" },
  { href: "/story", label: "Mission Freefall", title: "Interactive space fire adventure", detail: "Build NASA's experiment and investigate", icon: "fire", group: "Priority" },
  ...NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label }))),
].filter((item, index, array) => array.findIndex((candidate) => candidate.href === item.href) === index);

export function CommandDeck() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [scope, setScope] = useState("All");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scopes = ["All", "Explore", "Evidence", "Analyze", "Mission", "About"];
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((item) =>
      (scope === "All" || item.group === scope) &&
      (!q || [item.label, item.title, item.detail, item.group].join(" ").toLowerCase().includes(q)),
    );
  }, [query, scope]);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = !!target?.closest("input, textarea, select, [contenteditable='true']");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === "/" && !typing && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = priorOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  // A new page always starts with the command deck closed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route navigation closes global dialogue
    setOpen(false);
  }, [pathname]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setSelected(0);
    router.push(href);
  }

  function onKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((value) => Math.min(matches.length - 1, value + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((value) => Math.max(0, value - 1));
    }
    if (event.key === "Enter" && matches[selected]) {
      event.preventDefault();
      navigate(matches[selected].href);
    }
  }

  return (
    <>
      <button ref={triggerRef} type="button" className="cosmic-command-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label="Open mission command center, shortcut Control K">
        <span className="cosmic-command-radar" aria-hidden="true"><span /></span>
        <span className="cosmic-command-label">Mission control</span>
        <kbd aria-hidden="true">⌘ K</kbd>
      </button>
      {open && (
        <div className="cosmic-command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="cosmic-command-dialog" role="dialog" aria-modal="true" aria-label="Mission command center" onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), input, a[href]"));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }}>
            <header className="cosmic-command-head">
              <div><p className="cosmic-eyebrow">MF // Orbital navigation system</p><h2 className="display">Where to, explorer?</h2></div>
              <button type="button" className="cosmic-close" onClick={() => setOpen(false)} aria-label="Close command center">×</button>
            </header>
            <div className="cosmic-command-search">
              <span aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                type="search"
                value={query}
                placeholder="Search missions, records, labs, science…"
                onChange={(event) => { setQuery(event.target.value); setSelected(0); }}
                onKeyDown={onKeys}
                aria-label="Search all destinations"
                aria-controls="cosmic-command-results"
              />
              <kbd>↵</kbd>
            </div>
            <div className="cosmic-command-scopes" aria-label="Filter destinations">
              {scopes.map((item) => <button key={item} type="button" aria-pressed={scope === item} onClick={() => { setScope(item); setSelected(0); }}>{item}</button>)}
            </div>
            <div id="cosmic-command-results" className="cosmic-command-results" role="group" aria-label="Destinations">
              {matches.length === 0 ? <p className="cosmic-empty">No matching stations. Try “flame”, “evidence”, or “mission”.</p> : matches.map((item, index) => (
                <button key={item.href} className="cosmic-command-result" data-selected={index === selected} onMouseEnter={() => setSelected(index)} onClick={() => navigate(item.href)} type="button">
                  <span className="cosmic-result-icon"><StationIcon name={item.icon} /></span>
                  <span className="cosmic-result-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <span className="cosmic-result-end">{item.group}<span aria-hidden="true">↗</span></span>
                </button>
              ))}
            </div>
            <footer className="cosmic-command-foot"><span><i aria-hidden="true" /> All pathways preserve NASA source traceability.</span><span>↑ ↓ navigate · ↵ open · Esc close</span></footer>
            <p className="sr-only">Press Control K or Command K from anywhere to open this command center.</p>
          </section>
        </div>
      )}
    </>
  );
}
