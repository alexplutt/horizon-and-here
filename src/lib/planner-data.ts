import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;
export type Goal = Tables<"goals">;
export type Completion = Tables<"task_completions">;

export const tasksQuery = () =>
  queryOptions({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const goalsQuery = () =>
  queryOptions({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("completed", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

/** Per-day done marks for repeating tasks (recent window is enough for the UI). */
export const completionsQuery = () =>
  queryOptions({
    queryKey: ["completions"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("task_completions")
        .select("task_id, date")
        .gte("date", since.toISOString().slice(0, 10));
      if (error) throw error;
      return data;
    },
  });

export const completionKey = (taskId: string, date: string) => `${taskId}:${date}`;

export type TaskInput = {
  title: string;
  description: string;
  due_date: string;
  repeat: "none" | "daily" | "weekdays";
};
export type GoalInput = { title: string; description: string; target_date: string | null };

function onError(e: unknown) {
  toast.error("Не удалось сохранить", {
    description: e instanceof Error ? e.message : String(e),
  });
}

export function useSaveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TaskInput & { id?: string | undefined }) => {
      const { error } = id
        ? await supabase.from("tasks").update(input).eq("id", id)
        : await supabase.from("tasks").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError,
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        old?.map((t) => (t.id === id ? { ...t, completed } : t)),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      onError(e);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/** Mark/unmark one day of a repeating task as done. */
export function useToggleOccurrence() {
  const qc = useQueryClient();
  type Row = { task_id: string; date: string };
  return useMutation({
    mutationFn: async ({ taskId, date, completed }: { taskId: string; date: string; completed: boolean }) => {
      const { error } = completed
        ? await supabase
            .from("task_completions")
            .upsert({ task_id: taskId, date }, { onConflict: "task_id,date", ignoreDuplicates: true })
        : await supabase.from("task_completions").delete().eq("task_id", taskId).eq("date", date);
      if (error) throw error;
    },
    onMutate: async ({ taskId, date, completed }) => {
      await qc.cancelQueries({ queryKey: ["completions"] });
      const prev = qc.getQueryData<Row[]>(["completions"]);
      qc.setQueryData<Row[]>(["completions"], (old = []) =>
        completed
          ? [...old, { task_id: taskId, date }]
          : old.filter((c) => !(c.task_id === taskId && c.date === date)),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["completions"], ctx.prev);
      onError(e);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["completions"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError,
  });
}

export function useSaveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: GoalInput & { id?: string | undefined }) => {
      const { error } = id
        ? await supabase.from("goals").update(input).eq("id", id)
        : await supabase.from("goals").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError,
  });
}

export function useToggleGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("goals").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError,
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError,
  });
}
