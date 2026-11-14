import { describe, expect, it } from "vitest";
import { addDays, dueStatus, nextTwoDays, overdueTasks } from "./dates";

const today = "2026-11-14";

describe("next two days plan", () => {
  it("includes only tasks due today and tomorrow", () => {
    const tasks = [
      { id: "a", due_date: "2026-11-13", completed: false },
      { id: "b", due_date: "2026-11-14", completed: false },
      { id: "c", due_date: "2026-11-15", completed: true },
      { id: "d", due_date: "2026-11-16", completed: false },
    ];
    const plan = nextTwoDays(tasks, today);
    expect(plan.today.map((t) => t.id)).toEqual(["b"]);
    expect(plan.tomorrow.map((t) => t.id)).toEqual(["c"]);
  });

  it("rolls tomorrow over month boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});

describe("deadline control", () => {
  it("marks an unfinished task past its deadline as overdue", () => {
    expect(dueStatus({ due_date: "2026-11-13", completed: false }, today)).toBe("overdue");
  });

  it("does not count a completed task as overdue", () => {
    const tasks = [{ due_date: "2026-11-10", completed: true }];
    expect(overdueTasks(tasks, today)).toHaveLength(0);
    expect(dueStatus({ due_date: "2026-11-10", completed: true }, today)).toBe("done");
  });

  it("a task due today is not overdue", () => {
    expect(dueStatus({ due_date: today, completed: false }, today)).toBe("today");
  });
});
