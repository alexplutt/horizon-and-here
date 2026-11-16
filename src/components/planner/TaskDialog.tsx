import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { addDays, formatDay, formatWeekday, isRecurring, toISODate } from "@/lib/dates";
import { overridesQuery, useSaveDayEdit, useSaveTask, type Task } from "@/lib/planner-data";
import { taskOnDay } from "@/lib/overrides";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultDate,
  occurrenceDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null | undefined;
  defaultDate?: string | undefined;
  /** Day the repeating task was opened from; enables "only this day" edits. */
  occurrenceDate?: string | undefined;
}) {
  const save = useSaveTask();
  const saveDay = useSaveDayEdit();
  const { data: overrides = [] } = useQuery(overridesQuery());
  const dayDate = task && isRecurring(task) && occurrenceDate ? occurrenceDate : undefined;
  const [scope, setScope] = useState<"day" | "all">("day");
  const onlyDay = Boolean(dayDate) && scope === "day";
  const today = toISODate(new Date());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(today);
  const [daily, setDaily] = useState(false);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);

  useEffect(() => {
    if (!open) return;
    const shown = task && dayDate ? taskOnDay(task, overrides, dayDate) : task;
    setScope("day");
    setTitle(shown?.title ?? "");
    setDescription(shown?.description ?? "");
    setDueDate(task?.due_date ?? defaultDate ?? today);
    setDaily(task?.repeat === "daily" || task?.repeat === "weekdays");
    setWeekdaysOnly(task?.repeat === "weekdays");
    // overrides intentionally omitted: refetches must not wipe what the user is typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, defaultDate, today, dayDate]);

  function changeScope(next: "day" | "all") {
    if (!task || next === scope) return;
    const shown = next === "day" && dayDate ? taskOnDay(task, overrides, dayDate) : task;
    setScope(next);
    setTitle(shown.title);
    setDescription(shown.description);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    if (task && dayDate && onlyDay) {
      await saveDay.mutateAsync({
        task,
        date: dayDate,
        title: title.trim(),
        description: description.trim(),
      });
      onOpenChange(false);
      return;
    }
    await save.mutateAsync({
      id: task?.id,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate,
      repeat: weekdaysOnly ? "weekdays" : daily ? "daily" : "none",
    });
    onOpenChange(false);
  }

  const quick = [
    { label: "Сегодня", value: today },
    { label: "Завтра", value: addDays(today, 1) },
    { label: "Через неделю", value: addDays(today, 7) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {task ? "Изменить задачу" : "Новая задача"}
            </DialogTitle>
            <DialogDescription>
              {onlyDay && dayDate
                ? `Изменения коснутся только ${formatWeekday(dayDate).replace(/а$/, "у")}, ${formatDay(dayDate)}.`
                : "Что сделать и к какому сроку."}
            </DialogDescription>
          </DialogHeader>

          {dayDate && (
            <div
              role="radiogroup"
              aria-label="Что изменить"
              className="grid grid-cols-2 gap-1 rounded-md border bg-muted/40 p-1"
            >
              {(
                [
                  { id: "day", label: `Только ${formatDay(dayDate)}` },
                  { id: "all", label: "Все дни" },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={scope === o.id}
                  onClick={() => changeScope(o.id)}
                  className={cn(
                    "cursor-pointer rounded px-3 py-1.5 text-sm transition-colors",
                    scope === o.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="task-title">Заголовок</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, отправить отчёт"
              maxLength={200}
              required
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-description">Описание</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Детали, ссылки, критерии готовности"
              rows={4}
              maxLength={4000}
            />
          </div>

          {!onlyDay && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="task-due">{daily ? "Начиная с" : "Крайний срок"}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="task-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-auto font-mono"
                    required
                  />
                  {quick.map((q) => (
                    <Button
                      key={q.label}
                      type="button"
                      size="sm"
                      variant={dueDate === q.value ? "default" : "outline"}
                      onClick={() => setDueDate(q.value)}
                    >
                      {q.label}
                    </Button>
                  ))}
                </div>
              </div>

              <fieldset className="grid gap-3 rounded-md border border-dashed p-3">
                <legend className="px-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  Повтор
                </legend>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={daily}
                    onCheckedChange={(v) => {
                      setDaily(v === true);
                      if (v !== true) setWeekdaysOnly(false);
                    }}
                  />
                  Ежедневно
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={weekdaysOnly}
                    onCheckedChange={(v) => {
                      setWeekdaysOnly(v === true);
                      if (v === true) setDaily(true);
                    }}
                  />
                  Только будни
                  <span className="text-xs text-muted-foreground">
                    вс–чт, без пятницы и субботы
                  </span>
                </label>
                {daily && (
                  <p className="text-xs text-muted-foreground">
                    Задача будет появляться {weekdaysOnly ? "каждый будний день" : "каждый день"} и
                    отмечаться выполненной отдельно за каждый день.
                  </p>
                )}
              </fieldset>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="signal"
              disabled={save.isPending || saveDay.isPending || !title.trim()}
            >
              {save.isPending || saveDay.isPending
                ? "Сохраняю…"
                : task
                  ? "Сохранить"
                  : "Добавить задачу"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
