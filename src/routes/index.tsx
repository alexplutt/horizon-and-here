import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarClock, Mountain, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Срок — задачи со сроками и долгосрочные цели" },
      {
        name: "description",
        content:
          "Ставьте задачи с заголовком, описанием и крайним сроком. Цели и план на два дня всегда на экране.",
      },
      { property: "og:title", content: "Срок — задачи со сроками и долгосрочные цели" },
      {
        property: "og:description",
        content: "Ставьте задачи с крайним сроком и контролируйте выполнение. Цели и план на два дня всегда на экране.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSignedIn(true);
        navigate({ to: "/dashboard", replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-paper-grid">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <span className="font-display text-xl font-bold">
          Срок<span className="text-accent">.</span>
        </span>
        {signedIn ? (
          <Button asChild variant="ink" size="sm">
            <Link to="/dashboard">Открыть планер</Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth" search={{ redirect: undefined }}>
              Войти
            </Link>
          </Button>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 lg:pt-24">
        <div className="max-w-3xl animate-rise">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Планер задач и целей
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-6xl">
            У каждой задачи — <span className="marker">свой срок</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Записывайте задачи с описанием и крайней датой, отмечайте выполненные и сразу видите,
            что горит. Долгосрочные цели и план на два дня всегда перед глазами.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="ink" size="lg" className="h-12 px-6 text-base">
              <Link to="/auth" search={{ redirect: undefined }}>
                Начать планировать
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          <Feature
            icon={<Mountain />}
            title="Долгосрочные цели"
            text="Отдельная колонка для больших целей — не теряются среди ежедневных дел."
            dark
          />
          <Feature
            icon={<CalendarClock />}
            title="План на 2 дня"
            text="Сегодня и завтра всегда на экране, чтобы день начинался с ясности."
          />
          <Feature
            icon={<TriangleAlert />}
            title="Контроль сроков"
            text="Просроченные задачи подсвечиваются красным и не дают о себе забыть."
          />
        </div>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-6 text-sm text-muted-foreground">
        <span>© 2026 Срок</span>
        <Link to="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Политика конфиденциальности
        </Link>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
  dark,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "rounded-lg bg-panel p-6 text-panel-foreground [&_svg]:text-highlight"
          : "rounded-lg border border-primary bg-card p-6 shadow-lift [&_svg]:text-accent"
      }
    >
      <div className="[&_svg]:h-6 [&_svg]:w-6">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className={dark ? "mt-2 text-sm text-panel-muted" : "mt-2 text-sm text-muted-foreground"}>
        {text}
      </p>
    </div>
  );
}
