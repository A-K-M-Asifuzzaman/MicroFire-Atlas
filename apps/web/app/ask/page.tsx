import type { Metadata } from "next";
import Link from "next/link";
import { AskPanel } from "@/components/AskPanel";
import { RouteStage } from "@/components/world/RouteStage";

export const metadata: Metadata = { title: "Ask" };

export default function AskPage() {
  return (
    <div className="explorer-page mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <RouteStage kind="ask" />
      <p className="mt-6 text-sm text-muted max-w-[78ch]">
        Questions are answered only from the NASA tests and quotes in this atlas. Every claim is labelled as observed,
        derived, interpretation or data gap, and its citations are checked before you see it.{" "}
        <Link href="/methodology#ai" className="link">
          How the AI is constrained
        </Link>
      </p>
      <div id="ask-tool" className="scroll-mt-20 mt-8">
        <AskPanel />
      </div>
    </div>
  );
}
