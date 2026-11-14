import { useState } from "react";
import { Mountain, Pencil, Plus, Trash2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { daysLeft, formatFull, pluralDays } from "@/lib/dates";
import {
  goalsQuery,
  useDeleteGoal,
  useToggleGoal,
  type Goal,
} from "@/lib/planner-data";
import { GoalDialog } from "./GoalDialog";

export function GoalsPanel({ today }: { today: string }) {
  const { data: goals } = useSuspenseQuery(goalsQuery());
  const toggle = useToggleGoal();
  const del = useDeleteGoal();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const active = goals.filter((g) => !g.completed).length;

  return (
    <section
      aria-labelledby="goals-title"
      className="flex h-full flex-col rounded-lg bg-panel text-panel-foreground"
    >
      <header className="flex items-start justify-between gap-3 border-b border-panel-border p-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-panel-muted">
            Горизонт
          </p>
          <h2 id="goals-title" className="mt-1 text-lg font-semibold">
            Долгосрочные цели
          </h2>
          <p className="mt-1 text-xs text-panel-muted">
            {active} {active === 1 ? "активная" : "активных"} из {goals.length}
          </p>
        </div>
        <Button
          size="icon"
          variant="panel"
          aria-label="Добавить цель"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-panel-muted">
            <Mountain className="h-8 w-8" />
            <p className="text-sm">Запишите то, к чему идёте месяцами — цели всегда будут перед глазами.</p>
            <Button
              variant="signal"
              size="sm"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              Добавить первую цель
            </Button>
          </div>
        ) : (
          <ol className="grid gap-2">
            {goals.map((g, i) => {
              const left = g.target_date ? daysLeft(g.target_date, today) : null;
              return (
                <li
                  key={g.id}
                  className={cn(
                    "group animate-rise flex gap-3 rounded-md border border-panel-border p-3",
                    g.completed && "opacity-55",
                  )}
                >
                  <span className="font-mono text-xs text-panel-muted pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "font-medium leading-snug break-words",
                        g.completed && "line-through",
                      )}
                    >
                      {g.title}
                    </p>
                    {g.description && (
                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm break-words text-panel-muted">
                        {g.description}
                      </p>
                    )}
                    {g.target_date && (
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-panel-muted">
                        до {formatFull(g.target_date)}
                        {!g.completed && left !== null && (
                          <span className={cn("ml-2", left < 0 ? "text-accent" : "text-highlight")}>
                            {left < 0
                              ? `срок прошёл`
                              : left === 0
                                ? "сегодня"
                                : `${left} ${pluralDays(left)}`}
                          </span>
                        )}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-panel-muted">
                        <Checkbox
                          checked={g.completed}
                          onCheckedChange={(v) => toggle.mutate({ id: g.id, completed: v === true })}
                          className="border-panel-muted data-[state=checked]:border-success data-[state=checked]:bg-success"
                        />
                        {g.completed ? "Достигнута" : "Отметить достигнутой"}
                      </label>
                      <div className="ml-auto flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <Button
                          size="icon"
                          variant="panel"
                          className="h-7 w-7 border-transparent"
                          aria-label="Изменить цель"
                          onClick={() => {
                            setEditing(g);
                            setOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="panel"
                          className="h-7 w-7 border-transparent hover:text-accent"
                          aria-label="Удалить цель"
                          onClick={() => {
                            if (confirm(`Удалить цель «${g.title}»?`)) del.mutate(g.id);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <GoalDialog open={open} onOpenChange={setOpen} goal={editing} />
    </section>
  );
}
