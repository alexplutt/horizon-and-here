// Archive of past days: every task occurrence dated before today, grouped by day,
// newest day first. Derived from tasks (no separate storage), so nothing is ever lost.
import { addDays, occursOn } from "./dates";

export type ArchiveDay<T> = { date: string; tasks: T[] };

/** Past days (before `today`) within the last `windowDays` days that had at least one task. */
export function pastDays<T extends { due_date: string; repeat?: string | undefined }>(
  tasks: T[],
  today: string,
  windowDays: number,
): ArchiveDay<T>[] {
  const days: ArchiveDay<T>[] = [];
  for (let i = 1; i <= windowDays; i++) {
    const date = addDays(today, -i);
    const list = tasks.filter((t) => occursOn(t, date));
    if (list.length > 0) days.push({ date, tasks: list });
  }
  return days;
}

/** Whether there are archived tasks older than the shown window. */
export function hasOlder<T extends { due_date: string }>(tasks: T[], today: string, windowDays: number) {
  const edge = addDays(today, -windowDays);
  return tasks.some((t) => t.due_date < edge);
}
