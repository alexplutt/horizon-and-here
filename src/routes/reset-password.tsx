import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Новый пароль — Срок" },
      { name: "description", content: "Задайте новый пароль для входа в планер." },
      { property: "og:title", content: "Новый пароль — Срок" },
      { property: "og:description", content: "Задайте новый пароль для входа в планер." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("Не удалось сменить пароль", { description: error.message });
      return;
    }
    toast.success("Пароль обновлён");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-grid p-6">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-4 rounded-lg border border-primary bg-card p-6 shadow-lift">
        <h1 className="text-xl font-semibold">Новый пароль</h1>
        <div className="grid gap-2">
          <Label htmlFor="new-password">Пароль</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" variant="ink" disabled={busy}>
          {busy ? "Сохраняю…" : "Сохранить пароль"}
        </Button>
      </form>
    </div>
  );
}
