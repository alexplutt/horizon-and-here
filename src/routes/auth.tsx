import { useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";
import { safeRedirect } from "@/lib/safe-redirect";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ href: safeRedirect(search.redirect) });
  },
  head: () => ({
    meta: [
      { title: "Вход — Срок" },
      { name: "description", content: "Войдите, чтобы ставить задачи и следить за сроками." },
      { property: "og:title", content: "Вход — Срок" },
      { property: "og:description", content: "Войдите, чтобы ставить задачи и следить за сроками." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const target = safeRedirect(search.redirect);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ href: target, replace: true });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ href: target, replace: true });
        else setNotice("Мы отправили письмо со ссылкой для подтверждения. Откройте его, чтобы войти.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("Если такой адрес зарегистрирован, на него придёт ссылка для смены пароля.");
      }
    } catch (err) {
      toast.error(translateError(err));
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Не удалось войти", { description: result.error.message });
      return;
    }
    if (result.redirected) return;
    navigate({ href: target, replace: true });
  }

  const title =
    mode === "signin" ? "С возвращением" : mode === "signup" ? "Создать аккаунт" : "Сброс пароля";

  return (
    <div className="grid min-h-screen bg-paper-grid lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-panel p-10 text-panel-foreground lg:flex">
        <Link to="/" className="font-display text-2xl font-bold">
          Срок<span className="text-accent">.</span>
        </Link>
        <div className="max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">
            Каждая задача — со своим <span className="text-highlight">сроком</span>.
          </p>
          <p className="mt-4 text-panel-muted">
            Цели на горизонте и план на ближайшие два дня всегда перед глазами.
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-panel-muted">
          Поставил · Сделал · Отметил
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 block font-display text-2xl font-bold lg:hidden">
            Срок<span className="text-accent">.</span>
          </Link>
          <h1 className="text-2xl font-semibold">{title}</h1>

          {mode !== "forgot" && (
            <div className="mt-6 grid gap-2">
              <Button variant="google" className="h-10 w-full" onClick={() => oauth("google")}>
                <GoogleLogo />
                Continue with Google
              </Button>
              <button
                type="button"
                className="lovable-auth-button w-full"
                onClick={() => oauth("lovable")}
              >
                Continue with Lovable
              </button>
              <div className="my-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> или по почте <span className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}

          <form onSubmit={submit} className={cn("grid gap-4", mode === "forgot" && "mt-6")}>
            <div className="grid gap-2">
              <Label htmlFor="email">Электронная почта</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {mode !== "forgot" && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Пароль</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            {notice && (
              <p className="rounded-md border border-success/40 bg-success/10 p-3 text-sm">{notice}</p>
            )}
            <Button type="submit" variant="ink" className="h-10" disabled={busy}>
              {busy
                ? "Подождите…"
                : mode === "signin"
                  ? "Войти"
                  : mode === "signup"
                    ? "Зарегистрироваться"
                    : "Отправить ссылку"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Нет аккаунта?{" "}
                <button className="cursor-pointer font-medium text-foreground underline underline-offset-4" onClick={() => { setMode("signup"); setNotice(null); }}>
                  Зарегистрироваться
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{" "}
                <button className="cursor-pointer font-medium text-foreground underline underline-offset-4" onClick={() => { setMode("signin"); setNotice(null); }}>
                  Войти
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function translateError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/invalid login credentials/i.test(msg)) return "Неверная почта или пароль";
  if (/email not confirmed/i.test(msg)) return "Подтвердите почту — ссылка в письме";
  if (/already registered/i.test(msg)) return "Этот адрес уже зарегистрирован";
  if (/password/i.test(msg) && /characters|weak|pwned/i.test(msg)) return "Пароль слишком простой — выберите другой";
  return msg;
}
