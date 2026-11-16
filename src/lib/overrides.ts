// Day-only edits of repeating tasks. A row in task_overrides replaces the title and
// description of a repeating task for exactly one date; other days keep the base task.

export type DayOverride = { task_id: string; date: string; title: string; description: string };

export function findOverride(overrides: DayOverride[], taskId: string, date: string | null | undefined) {
  if (!date) return undefined;
  return overrides.find((o) => o.task_id === taskId && o.date === date);
}

/** The task as it should look on `date` (base task when no day edit exists). */
export function taskOnDay<T extends { id: string; title: string; description: string }>(
  task: T,
  overrides: DayOverride[],
  date: string | null | undefined,
): T {
  const o = findOverride(overrides, task.id, date);
  return o ? { ...task, title: o.title, description: o.description } : task;
}

/** A day edit equal to the base task is redundant and should be removed. */
export function isSameAsBase(
  task: { title: string; description: string },
  edit: { title: string; description: string },
) {
  return task.title === edit.title && task.description === edit.description;
}
