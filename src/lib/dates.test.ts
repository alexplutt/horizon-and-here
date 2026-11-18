import { describe, expect, it } from "vitest";
import { addDays, dueStatus, inMonthWindow, monthAhead, nextWeekStart, nextOccurrence, nextTwoDays, occursOn, overdueTasks } from "./dates";

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

describe("repeating tasks", () => {
  // 2026-11-13 is a Friday, 2026-11-14 a Saturday, 2026-11-15 a Sunday.
  const weekdays = { due_date: "2026-11-01", repeat: "weekdays", completed: false };
  const daily = { due_date: "2026-11-01", repeat: "daily", completed: false };

  it("weekdays-only tasks skip Friday and Saturday", () => {
    expect(occursOn(weekdays, "2026-11-13")).toBe(false);
    expect(occursOn(weekdays, "2026-11-14")).toBe(false);
  });

  it("weekdays-only tasks run Sunday through Thursday", () => {
    for (const d of ["2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"]) {
      expect(occursOn(weekdays, d)).toBe(true);
    }
  });

  it("daily tasks run every day including Friday and Saturday", () => {
    expect(occursOn(daily, "2026-11-13")).toBe(true);
    expect(occursOn(daily, "2026-11-14")).toBe(true);
  });

  it("repeating tasks do not start before their start date", () => {
    expect(occursOn({ ...daily, due_date: "2026-11-20" }, "2026-11-19")).toBe(false);
  });

  it("appear in the two-day plan on the days they run", () => {
    const plan = nextTwoDays([weekdays, daily], today); // Saturday + Sunday
    expect(plan.today).toEqual([daily]);
    expect(plan.tomorrow).toEqual([weekdays, daily]);
  });

  it("are never counted as overdue", () => {
    expect(overdueTasks([weekdays, daily], today)).toHaveLength(0);
  });

  it("next weekday occurrence after a Friday is Sunday", () => {
    expect(nextOccurrence(weekdays, "2026-11-13")).toBe("2026-11-15");
  });
});

describe("task list window", () => {
  it("next week starts on the nearest Sunday after today", () => {
    expect(nextWeekStart("2026-11-18")).toBe("2026-11-22"); // Wednesday → Sunday
    expect(nextWeekStart("2026-11-21")).toBe("2026-11-22"); // Saturday → next day
    expect(nextWeekStart("2026-11-22")).toBe("2026-11-29"); // Sunday → following Sunday
  });

  it("shows tasks from today up to one month ahead", () => {
    expect(monthAhead("2026-11-18")).toBe("2026-12-18");
    expect(monthAhead("2026-01-31")).toBe("2026-02-28");
    expect(inMonthWindow("2026-11-17", "2026-11-18")).toBe(false);
    expect(inMonthWindow("2026-11-18", "2026-11-18")).toBe(true);
    expect(inMonthWindow("2026-12-18", "2026-11-18")).toBe(true);
    expect(inMonthWindow("2026-12-19", "2026-11-18")).toBe(false);
  });
});
