import { Plus } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { addDays, formatDay, formatWeekday, isRecurring, nextTwoDays } from "@/lib/dates";
import { completionKey, completionsQuery, tasksQuery, type Task } from "@/lib/planner-data";
import { TaskRow } from "./TaskRow";

function DayBlock({
  label,
  date,
  tasks,
  today,
  onAdd,
  onEdit,
}: {
  label: string;
  date: string;
  tasks: Task[];
  today: string;
  onAdd: (date: string) => void;
  onEdit: (t: Task, date?: string) => void;
}) {
  const { data: completions } = useSuspenseQuery(completionsQuery());
  const doneSet = new Set(completions.map((c) => completionKey(c.task_id, c.date)));
  const done = tasks.filter((t) =>
    isRecurring(t) ? doneSet.has(completionKey(t.id, date)) : t.completed,
  ).length;
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">
            <span className="marker">{label}</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {formatWeekday(date)}, {formatDay(date)}
            {tasks.length > 0 && ` · ${done}/${tasks.length}`}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => onAdd(date)}
          aria-label={`Добавить задачу на ${label.toLowerCase()}`}
        >
          <Plus /> Задача
        </Button>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
          Свободно
        </p>
      ) : (
        <ul className="grid gap-2">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} today={today} onEdit={onEdit} compact date={date} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function TwoDaysPanel({
  today,
  onAdd,
  onEdit,
}: {
  today: string;
  onAdd: (date: string) => void;
  onEdit: (t: Task, date?: string) => void;
}) {
  const { data: tasks } = useSuspenseQuery(tasksQuery());
  const plan = nextTwoDays(tasks, today);

  return (
    <section
      aria-labelledby="two-days-title"
      className="flex h-full flex-col rounded-lg border border-primary bg-card shadow-lift"
    >
      <header className="border-b p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Ближайшие 48 часов
        </p>
        <h2 id="two-days-title" className="mt-1 text-lg font-semibold">
          План на 2 дня
        </h2>
      </header>
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <DayBlock
          label="Сегодня"
          date={today}
          tasks={plan.today}
          today={today}
          onAdd={onAdd}
          onEdit={onEdit}
        />
        <DayBlock
          label="Завтра"
          date={addDays(today, 1)}
          tasks={plan.tomorrow}
          today={today}
          onAdd={onAdd}
          onEdit={onEdit}
        />
      </div>
    </section>
  );
}
