ALTER TABLE public.tasks ADD COLUMN repeat text NOT NULL DEFAULT 'none';
ALTER TABLE public.tasks ADD CONSTRAINT tasks_repeat_check CHECK (repeat IN ('none', 'daily', 'weekdays'));

CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_completions TO authenticated;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own completions" ON public.task_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own completions" ON public.task_completions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()));
CREATE POLICY "Users delete own completions" ON public.task_completions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX task_completions_user_date_idx ON public.task_completions (user_id, date);