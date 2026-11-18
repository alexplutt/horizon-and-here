import { useState } from "react";
import { Archive } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { hasOlder, pastDays } from "@/lib/archive";
import { formatDay, formatWeekday, isRecurring } from "@/lib/dates";
import { completionKey, completionsQuery, tasksQuery, type Task } from "@/lib/planner-data";
import { TaskRow } from "./TaskRow";

const STEP = 30;

export function ArchiveView({ today, onEdit }: { today: string; onEdit: (t: Task, date?: string) => void }) {
  const { data: tasks } = useSuspenseQuery(tasksQuery());
  const { data: completions } = useSuspenseQuery(completionsQuery());
  const [windowDays, setWindowDays] = useState(STEP);
  const doneSet = new Set(completions.map((c) => completionKey(c.task_id, c.date)));
  const days = pastDays(tasks, today, windowDays);
  const more = hasOlder(tasks, today, windowDays);

  if (days.length === 0 && !more) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card/60 px-6 py-16 text-center">
        <Archive className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">Здесь будут храниться задачи прошедших дней.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {days.map(({ date, tasks: list }) => {
        const done = list.filter((t) =>
          isRecurring(t) ? doneSet.has(completionKey(t.id, date)) : t.completed,
        ).length;
        return (
          <div key={date}>
            <div className="mb-2 flex items-baseline gap-3 border-b border-dashed pb-1">
              <span className="font-display text-sm font-semibold">{formatDay(date)}</span>
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {formatWeekday(date)}
              </span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                выполнено {done}/{list.length}
              </span>
            </div>
            <ul className="grid gap-2">
              {list.map((t) => (
                <TaskRow key={t.id} task={t} today={today} onEdit={onEdit} date={date} />
              ))}
            </ul>
          </div>
        );
      })}
      {more && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setWindowDays((w) => w + STEP)}>
            Показать более ранние дни
          </Button>
        </div>
      )}
    </div>
  );
}
