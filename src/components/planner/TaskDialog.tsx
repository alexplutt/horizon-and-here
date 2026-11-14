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
import { addDays, toISODate } from "@/lib/dates";
import { useSaveTask, type Task } from "@/lib/planner-data";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null | undefined;
  defaultDate?: string | undefined;
}) {
  const save = useSaveTask();
  const today = toISODate(new Date());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(today);
  const [daily, setDaily] = useState(false);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setDueDate(task?.due_date ?? defaultDate ?? today);
    setDaily(task?.repeat === "daily" || task?.repeat === "weekdays");
    setWeekdaysOnly(task?.repeat === "weekdays");
  }, [open, task, defaultDate, today]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
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
            <DialogDescription>Что сделать и к какому сроку.</DialogDescription>
          </DialogHeader>

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
              <span className="text-xs text-muted-foreground">вс–чт, без пятницы и субботы</span>
            </label>
            {daily && (
              <p className="text-xs text-muted-foreground">
                Задача будет появляться {weekdaysOnly ? "каждый будний день" : "каждый день"} и
                отмечаться выполненной отдельно за каждый день.
              </p>
            )}
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="signal" disabled={save.isPending || !title.trim()}>
              {save.isPending ? "Сохраняю…" : task ? "Сохранить" : "Добавить задачу"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
