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
import { useSaveGoal, type Goal } from "@/lib/planner-data";

export function GoalDialog({
  open,
  onOpenChange,
  goal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}) {
  const save = useSaveGoal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
    setTargetDate(goal?.target_date ?? "");
  }, [open, goal]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await save.mutateAsync({
      id: goal?.id,
      title: title.trim(),
      description: description.trim(),
      target_date: targetDate || null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {goal ? "Изменить цель" : "Новая долгосрочная цель"}
            </DialogTitle>
            <DialogDescription>Большая цель, к которой ведут ежедневные задачи.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="goal-title">Заголовок</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, выучить испанский до B2"
              maxLength={200}
              required
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-description">Описание</Label>
            <Textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Зачем это нужно и как понять, что цель достигнута"
              rows={4}
              maxLength={4000}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-date">Срок (необязательно)</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-auto font-mono"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="signal" disabled={save.isPending || !title.trim()}>
              {save.isPending ? "Сохраняю…" : goal ? "Сохранить" : "Добавить цель"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
