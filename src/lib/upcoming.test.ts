import { describe, expect, it } from "vitest";
import { upcomingDays } from "./upcoming";

const today = "2026-11-18"; // Wednesday

describe("upcoming month list", () => {
  it("never includes past-dated tasks", () => {
    const days = upcomingDays([{ id: "old", due_date: "2026-11-17" }], today);
    expect(days).toEqual([]);
  });

  it("includes one-off tasks up to one month ahead, not beyond", () => {
    const days = upcomingDays(
      [
        { id: "in", due_date: "2026-12-18" },
        { id: "out", due_date: "2026-12-19" },
      ],
      today,
    );
    expect(days.map((d) => d.date)).toEqual(["2026-12-18"]);
  });

  it("repeats a daily task in every day of the month", () => {
    const days = upcomingDays([{ id: "d", due_date: "2026-11-01", repeat: "daily" }], today);
    expect(days).toHaveLength(31); // Nov 18 … Dec 18
    expect(days[0]?.date).toBe("2026-11-18");
  });

  it("skips Friday and Saturday for weekday tasks", () => {
    const days = upcomingDays([{ id: "w", due_date: "2026-11-01", repeat: "weekdays" }], today);
    const dates = days.map((d) => d.date);
    expect(dates).not.toContain("2026-11-20"); // Friday
    expect(dates).not.toContain("2026-11-21"); // Saturday
    expect(dates).toContain("2026-11-22"); // Sunday
  });
});
