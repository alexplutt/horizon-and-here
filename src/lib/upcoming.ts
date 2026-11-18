// Upcoming days for the central task list: every day from today up to one month ahead
// that has at least one task, repeating tasks expanded into each matching day.
import { addDays, monthAhead, occursOn } from "./dates";

export type UpcomingDay<T> = { date: string; tasks: T[] };

export function upcomingDays<T extends { due_date: string; repeat?: string | undefined }>(
  tasks: T[],
  today: string,
): UpcomingDay<T>[] {
  const end = monthAhead(today);
  const days: UpcomingDay<T>[] = [];
  for (let date = today; date <= end; date = addDays(date, 1)) {
    const list = tasks.filter((t) => occursOn(t, date));
    if (list.length > 0) days.push({ date, tasks: list });
  }
  return days;
}
