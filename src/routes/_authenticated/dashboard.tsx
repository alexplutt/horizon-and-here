import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatFull, formatWeekday, toISODate } from "@/lib/dates";
import { completionsQuery, goalsQuery, tasksQuery, type Task } from "@/lib/planner-data";
import { GoalsPanel } from "@/components/planner/GoalsPanel";
import { TwoDaysPanel } from "@/components/planner/TwoDaysPanel";
import { TasksBoard } from "@/components/planner/TasksBoard";
import { TaskDialog } from "@/components/planner/TaskDialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Мой план — Срок" },
      { name: "description", content: "Задачи, сроки и долгосрочные цели в одном окне." },
      { property: "og:title", content: "Мой план — Срок" },
      { property: "og:description", content: "Задачи, сроки и долгосрочные цели в одном окне." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(tasksQuery());
    context.queryClient.ensureQueryData(goalsQuery());
    context.queryClient.ensureQueryData(completionsQuery());
  },
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-paper-grid font-mono text-sm text-muted-foreground">
      Открываю планер…
    </div>
  ),
  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper-grid p-6 text-center">
        <p className="font-display text-lg">Не удалось загрузить задачи</p>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
        <Button variant="ink" onClick={() => router.invalidate()}>
          Повторить
        </Button>
      </div>
    );
  },
  component: Dashboard,
});

function useToday() {
  const [today, setToday] = useState(() => toISODate(new Date()));
  useEffect(() => {
    const id = setInterval(() => setToday(toISODate(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

function Dashboard() {
  const today = useToday();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  const openNew = (date?: string) => {
    setEditing(null);
    setDefaultDate(date);
    setDialogOpen(true);
  };
  const openEdit = (t: Task) => {
    setEditing(t);
    setDialogOpen(true);
  };

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  }

  return (
    <div className="min-h-screen bg-paper-grid">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 lg:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-bold tracking-tight">
              Срок<span className="text-accent">.</span>
            </span>
            <span className="hidden font-mono text-xs uppercase tracking-wide text-muted-foreground sm:inline">
              {formatWeekday(today)}, {formatFull(today)}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ink" onClick={() => openNew()}>
              <Plus /> <span className="hidden sm:inline">Новая задача</span>
            </Button>
            <span className="hidden max-w-[180px] truncate text-sm text-muted-foreground md:inline">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Выйти">
              <LogOut />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-5 p-4 lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:p-6">
        <aside className="lg:sticky lg:top-[88px] lg:h-[calc(100vh-112px)]">
          <GoalsPanel today={today} />
        </aside>
        <div className="order-last lg:order-none">
          <TasksBoard today={today} onEdit={openEdit} />
        </div>
        <aside className="order-first lg:order-none lg:sticky lg:top-[88px] lg:h-[calc(100vh-112px)]">
          <TwoDaysPanel today={today} onAdd={openNew} onEdit={openEdit} />
        </aside>
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        defaultDate={defaultDate}
      />
    </div>
  );
}
