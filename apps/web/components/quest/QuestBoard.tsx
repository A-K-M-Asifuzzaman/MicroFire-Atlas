"use client";

import { useExplorer } from "@/components/guide/EmberGuide";
import { CREW, discovery, QUESTS, type CrewId } from "@/lib/guide";
import styles from "./QuestBoard.module.css";

/** Three real actions for this page. Each one lights a star in the explorer's constellation. */
export function QuestBoard({ page, crew = "kofi" }: { page: keyof typeof QUESTS; crew?: CrewId }) {
  const { found } = useExplorer();
  const quests = QUESTS[page] ?? [];
  const done = quests.filter((q) => found.includes(q.id)).length;
  const all = done === quests.length;
  const c = CREW[crew];
  return (
    <aside className={styles.board} data-complete={all} aria-label="Page quests">
      {/* eslint-disable-next-line @next/next/no-img-element -- static art; next/image would add inline styles the CSP blocks */}
      <img src={all ? c.poses.cheering : c.poses.pointing} alt="" className={styles.crew} />
      <div className={styles.body}>
        <p className={styles.title}>
          {all ? `Quest complete! ${c.name} is impressed.` : `${c.name}'s quest for this page`}
          <span className={styles.count}>{done} of {quests.length} stars</span>
        </p>
        <ol className={styles.list}>
          {quests.map((q) => {
            const got = found.includes(q.id);
            return (
              <li key={q.id} data-done={got}>
                <span className={styles.star} aria-hidden="true">{got ? "★" : "☆"}</span>
                <span>{got ? discovery(q.id)?.label : q.how}</span>
                <span className="sr-only">{got ? "done" : "to do"}</span>
              </li>
            );
          })}
        </ol>
        <span className={styles.bar} aria-hidden="true"><i data-step={done} /></span>
      </div>
    </aside>
  );
}
