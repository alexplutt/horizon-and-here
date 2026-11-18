import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { dueStatus, formatDay, formatWeekday, isRecurring, nextWeekStart } from "@/lib/dates";
import { completionKey, completionsQuery, tasksQuery, type Task } from "@/lib/planner-data";
import { TaskRow } from "./TaskRow";
import { ArchiveView } from "./ArchiveView";
import { pastDays } from "@/lib/archive";
import { upcomingDays } from "@/lib/upcoming";

type Filter = "active" | "done" | "all" | "archive";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "active", label: "В работе" },
  { id: "done", label: "Выполнено" },
  { id: "archive", label: "Архив" },
];

export function TasksBoard({ today, onEdit }: { today: string; onEdit: (t: Task, date?: string) => void }) {
  const { data: tasks } = useSuspenseQuery(tasksQuery());
  const { data: completions } = useSuspenseQuery(completionsQuery());
  const [filter, setFilter] = useState<Filter>("all");

  const oneOff = tasks.filter((t) => !isRecurring(t));
  const weekStart = nextWeekStart(today);

  const doneSet = useMemo(
    () => new Set(completions.map((c) => completionKey(c.task_id, c.date))),
    [completions],
  );
  const isDone = (t: Task, date: string) =>
    isRecurring(t) ? doneSet.has(completionKey(t.id, date)) : t.completed;

  // Today → one month ahead, day by day; repeating tasks appear in each matching day.
  const upcoming = useMemo(() => upcomingDays(tasks, today), [tasks, today]);

  const days = useMemo(() => {
    if (filter === "all") return upcoming;
    if (filter === "active")
      return upcoming
        .map((d) => ({ date: d.date, tasks: d.tasks.filter((t) => !isDone(t, d.date)) }))
        .filter((d) => d.tasks.length > 0);
    if (filter === "done") {
      // Finished one-off tasks, newest deadline first.
      const map = new Map<string, Task[]>();
      for (const t of oneOff.filter((t) => t.completed).reverse()) {
        map.set(t.due_date, [...(map.get(t.due_date) ?? []), t]);
      }
      return [...map.entries()].map(([date, list]) => ({ date, tasks: list }));
    }
    return [];
  }, [filter, upcoming, tasks, doneSet]);

  const counts = useMemo(() => {
    let all = 0;
    let active = 0;
    for (const d of upcoming) {
      all += d.tasks.length;
      active += d.tasks.filter((t) => !isDone(t, d.date)).length;
    }
    return {
      all,
      active,
      done: oneOff.filter((t) => t.completed).length,
      archive: pastDays(tasks, today, 30).length,
    };
  }, [upcoming, tasks, today, doneSet]);

  const pct = oneOff.length ? Math.round((counts.done / oneOff.length) * 100) : 0;

  return (
    <section aria-labelledby="board-title" className="min-w-0">
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="В работе" value={counts.active} sub="на месяц вперёд" />
        <Stat label="В архиве" value={counts.archive} sub="дней за месяц" />
        <Stat label="Выполнено" value={`${pct}%`} tone="success" sub={`${counts.done} из ${oneOff.length} разовых`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="board-title" className="text-xl font-semibold">
          {filter === "archive"
            ? "Архив прошедших дней"
            : filter === "done"
              ? "Выполненные задачи"
              : "Задачи на месяц вперёд"}
        </h2>
        <div role="tablist" aria-label="Фильтр задач" className="flex flex-wrap gap-1 rounded-md border bg-card p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "cursor-pointer rounded px-3 py-1.5 text-sm transition-colors",
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className="ml-1.5 font-mono text-xs opacity-70"
                title={f.id === "archive" ? "дней за последний месяц" : undefined}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filter === "archive" ? (
        <ArchiveView today={today} onEdit={onEdit} />
      ) : days.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card/60 px-6 py-16 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {filter === "done"
              ? "Здесь появятся выполненные задачи."
              : filter === "active"
                ? "На месяц вперёд всё выполнено."
                : "Задач на ближайший месяц нет. Добавьте первую кнопкой «Новая задача»."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {days.map(({ date, tasks: items }, i) => {
            const s = dueStatus({ due_date: date, completed: false }, today);
            const later = filter !== "done" && date >= weekStart;
            const firstLater = later && (i === 0 || (days[i - 1]?.date ?? "") < weekStart);
            const done = items.filter((t) => isDone(t, date)).length;
            return (
              <div key={date}>
                {firstLater && (
                  <p className="mb-3 rounded-sm bg-later px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    Следующие недели · с {formatDay(weekStart)}
                  </p>
                )}
                <div className="mb-2 flex items-baseline gap-3 border-b border-dashed pb-1">
                  <span className="font-display text-sm font-semibold">
                    {filter !== "done" && s === "today"
                      ? "Сегодня"
                      : filter !== "done" && s === "tomorrow"
                        ? "Завтра"
                        : formatDay(date)}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {formatWeekday(date)}
                  </span>
                  {filter === "all" && (
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                      {done}/{items.length}
                    </span>
                  )}
                </div>
                <ul className="grid gap-2">
                  {items.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      today={today}
                      onEdit={onEdit}
                      date={filter === "done" ? undefined : date}
                      later={later}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  sub?: string | undefined;
  tone?: "danger" | "success" | undefined;
}) {
  return (
    <div className="rounded-md border bg-card p-3 shadow-paper">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-semibold",
          tone === "danger" && "text-destructive",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
