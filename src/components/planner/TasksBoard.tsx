import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { dueStatus, formatDay, formatWeekday } from "@/lib/dates";
import { tasksQuery, type Task } from "@/lib/planner-data";
import { TaskRow } from "./TaskRow";

type Filter = "active" | "overdue" | "done" | "all";

const filters: { id: Filter; label: string }[] = [
  { id: "active", label: "В работе" },
  { id: "overdue", label: "Просрочено" },
  { id: "done", label: "Выполнено" },
  { id: "all", label: "Все" },
];

export function TasksBoard({ today, onEdit }: { today: string; onEdit: (t: Task) => void }) {
  const { data: tasks } = useSuspenseQuery(tasksQuery());
  const [filter, setFilter] = useState<Filter>("active");

  const counts = useMemo(() => {
    const c = { active: 0, overdue: 0, done: 0, all: tasks.length };
    for (const t of tasks) {
      const s = dueStatus(t, today);
      if (s === "done") c.done++;
      else c.active++;
      if (s === "overdue") c.overdue++;
    }
    return c;
  }, [tasks, today]);

  const visible = tasks.filter((t) => {
    const s = dueStatus(t, today);
    if (filter === "active") return s !== "done";
    if (filter === "overdue") return s === "overdue";
    if (filter === "done") return s === "done";
    return true;
  });

  // Group by deadline day
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    const list = filter === "done" ? [...visible].reverse() : visible;
    for (const t of list) {
      const arr = map.get(t.due_date) ?? [];
      arr.push(t);
      map.set(t.due_date, arr);
    }
    return [...map.entries()];
  }, [visible, filter]);

  const pct = tasks.length ? Math.round((counts.done / tasks.length) * 100) : 0;

  return (
    <section aria-labelledby="board-title" className="min-w-0">
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="В работе" value={counts.active} />
        <Stat label="Просрочено" value={counts.overdue} tone={counts.overdue > 0 ? "danger" : undefined} />
        <Stat label="Выполнено" value={`${pct}%`} tone="success" sub={`${counts.done} из ${tasks.length}`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="board-title" className="text-xl font-semibold">
          Все задачи
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
              <span className="ml-1.5 font-mono text-xs opacity-70">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card/60 px-6 py-16 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            {filter === "overdue"
              ? "Просроченных задач нет — так держать."
              : filter === "done"
                ? "Здесь появятся выполненные задачи."
                : "Задач пока нет. Добавьте первую кнопкой «Новая задача»."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, items]) => {
            const s = dueStatus({ due_date: date, completed: false }, today);
            return (
              <div key={date}>
                <div className="mb-2 flex items-baseline gap-3 border-b border-dashed pb-1">
                  <span
                    className={cn(
                      "font-display text-sm font-semibold",
                      s === "overdue" && filter !== "done" && "text-destructive",
                    )}
                  >
                    {s === "today" ? "Сегодня" : s === "tomorrow" ? "Завтра" : formatDay(date)}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                    {formatWeekday(date)}
                  </span>
                </div>
                <ul className="grid gap-2">
                  {items.map((t) => (
                    <TaskRow key={t.id} task={t} today={today} onEdit={onEdit} />
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
