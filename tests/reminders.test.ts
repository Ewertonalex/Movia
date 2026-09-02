import { describe, expect, it } from "vitest";
import { nextOccurrence } from "@/lib/google/calendar";
import { PLANNER_DEFAULTS, generateWeeklyPlan } from "@/lib/planner/plan";
import {
  clampReminderHour,
  formatSessionClock,
  nextTrainingReminder,
  parseSessionClock,
  shouldUseDeviceReminder,
} from "@/lib/planner/reminders";

describe("lembrete neste aparelho", () => {
  it("só oferece aviso local quando a agenda Google não foi usada", () => {
    const plan = generateWeeklyPlan(PLANNER_DEFAULTS);
    expect(shouldUseDeviceReminder(plan)).toBe(true);
    expect(
      shouldUseDeviceReminder({
        ...plan,
        calendarSyncedAt: "2026-09-02T12:00:00.000Z",
      }),
    ).toBe(false);
    expect(shouldUseDeviceReminder(null)).toBe(false);
  });

  it("escolhe o próximo treino no horário combinado", () => {
    expect(clampReminderHour(19)).toBe(19);
    expect(clampReminderHour(3)).toBe(5);
    expect(clampReminderHour(30)).toBe(23);

    const now = new Date("2026-09-02T10:00:00");
    const plan = generateWeeklyPlan(PLANNER_DEFAULTS);
    const reminder = nextTrainingReminder(plan, 19, now);
    expect(reminder).not.toBeNull();
    expect(reminder?.at.getHours()).toBe(19);
    expect(reminder?.title).toBe("MOVIA");
    expect(reminder?.body).toMatch(/Treino/);

    const wednesday = nextOccurrence("qua", now, 19);
    expect(reminder?.at.getTime()).toBe(wednesday.getTime());
  });

  it("aceita horário com minutos", () => {
    expect(formatSessionClock(7, 30)).toBe("07:30");
    expect(parseSessionClock("18:45")).toEqual({ hour: 18, minute: 45 });
    const now = new Date("2026-09-02T10:00:00");
    const at = nextOccurrence("qua", now, 6, 15);
    expect(at.getHours()).toBe(6);
    expect(at.getMinutes()).toBe(15);
  });
});
