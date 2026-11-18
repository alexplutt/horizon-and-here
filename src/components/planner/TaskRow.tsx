import { Pencil, Repeat, Trash2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  daysLeft,
  dueStatus,
  formatDay,
  formatWeekday,
  isRecurring,
  nextOccurrence,
  occursOn,
  pluralDays,
  repeatLabel,
  type DueStatus,
  type Repeat as RepeatKind,
} from "@/lib/dates";
import {
  completionKey,
  completionsQuery,
  overridesQuery,
  useDeleteTask,
  useToggleOccurrence,
  useToggleTask,
  type Task,
} from "@/lib/planner-data";
import { taskOnDay } from "@/lib/overrides";

const statusLabel: Record<DueStatus, string> = {
  done: "Готово",
  overdue: "Просрочено",
  today: "Сегодня",
  tomorrow: "Завтра",
  later: "",
};

const statusClass: Record<DueStatus, string> = {
  done: "bg-success/15 text-success",
  overdue: "bg-destructive text-destructive-foreground",
  today: "bg-highlight text-highlight-foreground",
  tomorrow: "bg-secondary text-secondary-foreground",
  later: "bg-muted text-muted-foreground",
};

export function DueBadge({ task, today }: { task: Task; today: string }) {
  const status = dueStatus(task, today);
  let text = statusLabel[status];
  if (status === "later") {
    const n = daysLeft(task.due_date, today);
    text = `через ${n} ${pluralDays(n)}`;
  }
  if (status === "overdue") {
    const n = -daysLeft(task.due_date, today);
    text = `просрочено на ${n} ${pluralDays(n)}`;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        statusClass[status],
      )}
    >
      {text}
    </span>
  );
}

export function RepeatBadge({ repeat }: { repeat: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-primary-foreground [&_svg]:h-3 [&_svg]:w-3">
      <Repeat aria-hidden />
      {repeatLabel[repeat as RepeatKind] ?? ""}
    </span>
  );
}

export function TaskRow({
  task: baseTask,
  today,
  onEdit,
  compact = false,
  date,
  later = false,
}: {
  task: Task;
  today: string;
  onEdit: (task: Task, date?: string) => void;
  compact?: boolean;
  /** Day this row stands for (repeating tasks are marked done per day). */
  date?: string | undefined;
  /** Falls after the current week: shown on a different background. */
  later?: boolean;
}) {
  const toggle = useToggleTask();
  const toggleOcc = useToggleOccurrence();
  const del = useDeleteTask();
  const { data: completions } = useSuspenseQuery(completionsQuery());
  const { data: overrides } = useSuspenseQuery(overridesQuery());
  const recurring = isRecurring(baseTask);
  // In a specific day (plan panel) show that day's own edit; the general list shows the series.
  const task = recurring && date ? taskOnDay(baseTask, overrides, date) : baseTask;
  const occDate = recurring ? (date ?? (occursOn(task, today) ? today : null)) : null;
  const doneSet = new Set(completions.map((c) => completionKey(c.task_id, c.date)));
  const completed = recurring
    ? occDate !== null && doneSet.has(completionKey(task.id, occDate))
    : task.completed;
  const status = recurring ? (completed ? "done" : "later") : dueStatus(task, today);
  const next = recurring ? nextOccurrence(task, today) : null;
  // A past day of a repeating task that was never marked done (shown in the archive).
  const missed = recurring && !!date && date < today && !completed;

  const onToggle = (v: boolean) => {
    if (recurring) {
      if (occDate) toggleOcc.mutate({ taskId: task.id, date: occDate, completed: v });
    } else {
      toggle.mutate({ id: task.id, completed: v });
    }
  };

  return (
    <li
      className={cn(
        "group animate-rise relative flex gap-3 rounded-md border bg-card p-3 shadow-paper transition-colors",
        status === "overdue" && "border-destructive/60",
        later && !completed && "bg-later",
        completed && "bg-muted/60 shadow-none",
      )}
    >
      {status === "overdue" && (
        <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r bg-destructive" />
      )}
      <Checkbox
        checked={completed}
        disabled={recurring && !occDate}
        onCheckedChange={(v) => onToggle(v === true)}
        aria-label={completed ? "Вернуть в работу" : "Отметить выполненной"}
        className="mt-0.5 h-5 w-5 rounded border-2 data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p
            className={cn(
              "font-medium leading-snug break-words",
              completed && "text-muted-foreground line-through decoration-2",
            )}
          >
            {task.title}
          </p>
        </div>
        {task.description && (
          <p
            className={cn(
              "mt-1 text-sm text-muted-foreground whitespace-pre-line break-words",
              compact ? "line-clamp-2" : "line-clamp-3",
            )}
          >
            {task.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {recurring && <RepeatBadge repeat={task.repeat} />}
          {missed && (
            <span className="inline-flex items-center rounded-sm bg-destructive/10 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-destructive">
              Не выполнено
            </span>
          )}
          {recurring && !compact && !date && next && (
            <span className="font-mono text-xs text-muted-foreground">
              {occDate === today
                ? completed
                  ? "сегодня выполнено"
                  : "сегодня"
                : `следующий раз: ${formatWeekday(next)}, ${formatDay(next)}`}
            </span>
          )}
          {!recurring && !compact && (
            <span className="font-mono text-xs text-muted-foreground">
              до {formatDay(task.due_date)}
            </span>
          )}
          {!recurring && (!compact || status === "overdue" || status === "done") && (
            <DueBadge task={task} today={today} />
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onEdit(baseTask, recurring ? date : undefined)}
          aria-label="Изменить задачу"
        >
          <Pencil />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 hover:text-destructive"
          onClick={() => {
            if (confirm(`Удалить задачу «${task.title}»?`)) del.mutate(task.id);
          }}
          aria-label="Удалить задачу"
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
