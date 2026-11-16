import { describe, expect, it } from "vitest";
import { isSameAsBase, taskOnDay } from "./overrides";

const task = { id: "t1", title: "Изучение вайбкодинга", description: "" };
const overrides = [
  { task_id: "t1", date: "2026-11-16", title: "Изучение вайбкодинга", description: "Продолжить изучение гитхаб" },
];

describe("day-only edits of repeating tasks", () => {
  it("shows the edit on the day it was made", () => {
    expect(taskOnDay(task, overrides, "2026-11-16").description).toBe("Продолжить изучение гитхаб");
  });

  it("keeps other days unchanged", () => {
    expect(taskOnDay(task, overrides, "2026-11-17").description).toBe("");
    expect(taskOnDay(task, overrides, null).description).toBe("");
  });

  it("does not leak an edit to another task", () => {
    expect(taskOnDay({ ...task, id: "t2" }, overrides, "2026-11-16").description).toBe("");
  });

  it("treats an edit equal to the base task as redundant", () => {
    expect(isSameAsBase(task, { title: task.title, description: "" })).toBe(true);
    expect(isSameAsBase(task, { title: task.title, description: "x" })).toBe(false);
  });
});
