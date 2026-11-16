CREATE TABLE public.task_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_overrides TO authenticated;
GRANT ALL ON public.task_overrides TO service_role;
ALTER TABLE public.task_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own overrides" ON public.task_overrides FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own overrides" ON public.task_overrides FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()));
CREATE POLICY "Users update own overrides" ON public.task_overrides FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.user_id = auth.uid()));
CREATE POLICY "Users delete own overrides" ON public.task_overrides FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX task_overrides_user_date_idx ON public.task_overrides (user_id, date);