import { describe, expect, it } from "vitest";
import { getDarshanWindowStatus } from "@/lib/liveDarshanSchedule";

describe("getDarshanWindowStatus", () => {
  it("returns the active slot when the current time falls inside a configured window", () => {
    const now = new Date("2026-07-29T06:29:00Z");
    const status = getDarshanWindowStatus(now, [
      { day_of_week: 3, start_time: "05:00", end_time: "12:00", is_active: true },
    ]);

    expect(status.currentSlot).toMatchObject({ start_time: "05:00", end_time: "12:00" });
    expect(status.isInSchedule).toBe(true);
  });

  it("returns the next upcoming slot when the current time is outside the active windows", () => {
    const now = new Date("2026-07-29T08:00:00Z");
    const status = getDarshanWindowStatus(now, [
      { day_of_week: 3, start_time: "05:00", end_time: "12:00", is_active: true },
      { day_of_week: 3, start_time: "18:00", end_time: "20:00", is_active: true },
    ]);

    expect(status.currentSlot).toBeNull();
    expect(status.nextSlot).toMatchObject({ start_time: "18:00", end_time: "20:00" });
  });

  it("ignores inactive slots and returns null when nothing is scheduled", () => {
    const now = new Date("2026-07-29T06:30:00Z");
    const status = getDarshanWindowStatus(now, [
      { day_of_week: 3, start_time: "05:00", end_time: "12:00", is_active: false },
    ]);

    expect(status.currentSlot).toBeNull();
    expect(status.nextSlot).toBeNull();
    expect(status.isInSchedule).toBe(false);
  });
});
