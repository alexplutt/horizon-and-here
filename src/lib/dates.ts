// Date helpers. Due dates are stored as plain "YYYY-MM-DD" strings (no time zone),
// so all comparisons use the user's local calendar day.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function parseISODate(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export type DueStatus = "done" | "overdue" | "today" | "tomorrow" | "later";

export function dueStatus(
  task: { due_date: string; completed: boolean },
  today: string,
): DueStatus {
  if (task.completed) return "done";
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  if (task.due_date === addDays(today, 1)) return "tomorrow";
  return "later";
}

/** Tasks whose deadline falls on today or tomorrow (the "next two days" plan). */
export function nextTwoDays<T extends { due_date: string }>(tasks: T[], today: string) {
  const tomorrow = addDays(today, 1);
  return {
    today: tasks.filter((t) => t.due_date === today),
    tomorrow: tasks.filter((t) => t.due_date === tomorrow),
  };
}

/** Unfinished tasks whose deadline has already passed. */
export function overdueTasks<T extends { due_date: string; completed: boolean }>(
  tasks: T[],
  today: string,
) {
  return tasks.filter((t) => !t.completed && t.due_date < today);
}

export function daysLeft(iso: string, today: string): number {
  const ms = parseISODate(iso).getTime() - parseISODate(today).getTime();
  return Math.round(ms / 86_400_000);
}

const dayFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const weekdayFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });
const fullFmt = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDay(iso: string) {
  return dayFmt.format(parseISODate(iso));
}
export function formatWeekday(iso: string) {
  return weekdayFmt.format(parseISODate(iso));
}
export function formatFull(iso: string) {
  return fullFmt.format(parseISODate(iso));
}

export function pluralDays(n: number) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return "дней";
  if (b === 1) return "день";
  if (b >= 2 && b <= 4) return "дня";
  return "дней";
}
