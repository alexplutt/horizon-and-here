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

export type Repeat = "none" | "daily" | "weekdays";

export function isRecurring(task: { repeat?: string | undefined }): boolean {
  return task.repeat === "daily" || task.repeat === "weekdays";
}

/** Weekend is Friday and Saturday; weekdays (будни) are Sunday–Thursday. */
export function isWeekend(iso: string): boolean {
  const day = parseISODate(iso).getDay(); // 0 = Sunday … 5 = Friday, 6 = Saturday
  return day === 5 || day === 6;
}

/** Whether a task falls on the given day. Recurring tasks start on their due_date. */
export function occursOn(task: { due_date: string; repeat?: string | undefined }, date: string) {
  if (!isRecurring(task)) return task.due_date === date;
  if (date < task.due_date) return false;
  if (task.repeat === "weekdays") return !isWeekend(date);
  return true;
}

/** First day on or after `from` when a recurring task occurs. */
export function nextOccurrence(
  task: { due_date: string; repeat?: string | undefined },
  from: string,
): string {
  let d = from < task.due_date ? task.due_date : from;
  for (let i = 0; i < 7 && !occursOn(task, d); i++) d = addDays(d, 1);
  return d;
}

export type DueStatus = "done" | "overdue" | "today" | "tomorrow" | "later";

export function dueStatus(
  task: { due_date: string; completed: boolean; repeat?: string | undefined },
  today: string,
): DueStatus {
  if (task.completed) return "done";
  if (isRecurring(task)) {
    const next = nextOccurrence(task, today);
    if (next === today) return "today";
    if (next === addDays(today, 1)) return "tomorrow";
    return "later";
  }
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  if (task.due_date === addDays(today, 1)) return "tomorrow";
  return "later";
}

/** Tasks planned for today or tomorrow (the "next two days" plan), including repeating ones. */
export function nextTwoDays<T extends { due_date: string; repeat?: string | undefined }>(
  tasks: T[],
  today: string,
) {
  const tomorrow = addDays(today, 1);
  return {
    today: tasks.filter((t) => occursOn(t, today)),
    tomorrow: tasks.filter((t) => occursOn(t, tomorrow)),
  };
}

/** Unfinished one-off tasks whose deadline has already passed. Repeating tasks are never overdue. */
export function overdueTasks<
  T extends { due_date: string; completed: boolean; repeat?: string | undefined },
>(tasks: T[], today: string) {
  return tasks.filter((t) => !isRecurring(t) && !t.completed && t.due_date < today);
}

export const repeatLabel: Record<Repeat, string> = {
  none: "",
  daily: "Ежедневно",
  weekdays: "По будням (вс–чт)",
};

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
