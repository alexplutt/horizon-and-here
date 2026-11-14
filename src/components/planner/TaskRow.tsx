import { Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { daysLeft, dueStatus, formatDay, pluralDays, type DueStatus } from "@/lib/dates";
import { useDeleteTask, useToggleTask, type Task } from "@/lib/planner-data";

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

export function TaskRow({
  task,
  today,
  onEdit,
  compact = false,
}: {
  task: Task;
  today: string;
  onEdit: (task: Task) => void;
  compact?: boolean;
}) {
  const toggle = useToggleTask();
  const del = useDeleteTask();
  const status = dueStatus(task, today);

  return (
    <li
      className={cn(
        "group animate-rise relative flex gap-3 rounded-md border bg-card p-3 shadow-paper transition-colors",
        status === "overdue" && "border-destructive/60",
        task.completed && "bg-muted/60 shadow-none",
      )}
    >
      {status === "overdue" && (
        <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r bg-destructive" />
      )}
      <Checkbox
        checked={task.completed}
        onCheckedChange={(v) => toggle.mutate({ id: task.id, completed: v === true })}
        aria-label={task.completed ? "Вернуть в работу" : "Отметить выполненной"}
        className="mt-0.5 h-5 w-5 rounded border-2 data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p
            className={cn(
              "font-medium leading-snug break-words",
              task.completed && "text-muted-foreground line-through decoration-2",
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
          {!compact && (
            <span className="font-mono text-xs text-muted-foreground">
              до {formatDay(task.due_date)}
            </span>
          )}
          {(!compact || status === "overdue" || status === "done") && (
            <DueBadge task={task} today={today} />
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onEdit(task)}
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
