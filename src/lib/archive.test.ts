import { describe, expect, it } from "vitest";
import { hasOlder, pastDays } from "./archive";

// 2026-11-18 is a Wednesday; 13 Nov = Friday, 14 Nov = Saturday.
const today = "2026-11-18";

describe("archive of past days", () => {
  it("keeps a one-off task under its past deadline day and never shows today", () => {
    const tasks = [
      { id: "past", due_date: "2026-11-16", repeat: "none" },
      { id: "today", due_date: "2026-11-18", repeat: "none" },
    ];
    const days = pastDays(tasks, today, 30);
    expect(days.map((d) => d.date)).toEqual(["2026-11-16"]);
    expect(days[0]?.tasks.map((t) => t.id)).toEqual(["past"]);
  });

  it("lists every past day of a daily task, newest first, from its start date", () => {
    const days = pastDays([{ id: "d", due_date: "2026-11-15", repeat: "daily" }], today, 30);
    expect(days.map((d) => d.date)).toEqual(["2026-11-17", "2026-11-16", "2026-11-15"]);
  });

  it("skips Friday and Saturday for a weekdays task", () => {
    const days = pastDays([{ id: "w", due_date: "2026-11-12", repeat: "weekdays" }], today, 30);
    expect(days.map((d) => d.date)).toEqual(["2026-11-17", "2026-11-16", "2026-11-15", "2026-11-12"]);
  });

  it("reports older tasks beyond the shown window", () => {
    const tasks = [{ id: "old", due_date: "2026-10-01", repeat: "none" }];
    expect(pastDays(tasks, today, 30)).toEqual([]);
    expect(hasOlder(tasks, today, 30)).toBe(true);
    expect(hasOlder(tasks, today, 60)).toBe(false);
  });
});
