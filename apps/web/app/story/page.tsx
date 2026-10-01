import type { Metadata } from "next";
import { StoryMode } from "@/components/StoryMode";

export const metadata: Metadata = {
  title: "Story mode",
  description: "Predict what real NASA fire tests on the ISS did, then watch the recorded outcome.",
};

export default function StoryPage() {
  return <StoryMode />;
}
