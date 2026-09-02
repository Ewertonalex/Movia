import { describe, expect, it } from "vitest";
import { EXERCISE_CATALOG, getExerciseById } from "@/lib/catalog";
import { PLANNER_DEFAULTS, generateWeeklyPlan } from "@/lib/planner/plan";
import {
  dateOfWeekdayThisWeek,
  formatLoadLabel,
  getExerciseProgress,
  localDateKey,
  logExerciseSkipped,
  logSetDone,
  normalizeLoad,
  sanitizeLoadDraft,
  startOfWeekMonday,
  statsSince,
  undoExerciseSession,
  usesExternalLoad,
  weekProgress,
  type SessionLogState,
} from "@/lib/planner/session-log";

const empty: SessionLogState = { days: [] };

describe("datas da semana", () => {
  it("começa a semana na segunda", () => {
    const wednesday = new Date("2026-09-02T15:00:00");
    const monday = startOfWeekMonday(wednesday);
    expect(monday.getDay()).toBe(1);
    expect(localDateKey(monday)).toBe("2026-08-31");
    expect(localDateKey(dateOfWeekdayThisWeek("sex", wednesday))).toBe(
      "2026-09-04",
    );
  });
});

describe("carga externa", () => {
  it("pede peso só quando o exercício usa carga", () => {
    expect(usesExternalLoad(getExerciseById("push-up"))).toBe(false);
    expect(usesExternalLoad(getExerciseById("pull-up"))).toBe(false);
    expect(usesExternalLoad(getExerciseById("bench-press"))).toBe(true);
    expect(usesExternalLoad(getExerciseById("hammer-curl"))).toBe(true);
    expect(usesExternalLoad(undefined)).toBe(false);
    expect(EXERCISE_CATALOG.some((item) => usesExternalLoad(item))).toBe(true);
  });

  it("aceita só número e formata em kg", () => {
    expect(normalizeLoad("3")).toBe("3kg");
    expect(normalizeLoad(" 12,5 kg ")).toBe("12,5kg");
    expect(normalizeLoad("40.5")).toBe("40,5kg");
    expect(normalizeLoad("abc")).toBeUndefined();
    expect(normalizeLoad("3kg!")).toBeUndefined();
    expect(sanitizeLoadDraft("3abc")).toBe("3");
    expect(sanitizeLoadDraft("12.5kg")).toBe("12,5");
    expect(sanitizeLoadDraft("-10")).toBe("10");
    expect(formatLoadLabel("3")).toBe("3kg");
    expect(formatLoadLabel("abc")).toBe("");
  });
});

describe("diário da série", () => {
  const base = {
    date: "2026-09-02",
    weekday: "qua" as const,
    planCreatedAt: "2026-08-01T12:00:00.000Z",
    exerciseId: "push-up",
    plannedSets: 2,
  };

  it("marca séries até o planejado e depois ignora", () => {
    const afterOne = logSetDone(empty, { ...base, at: "2026-09-02T19:01:00.000Z" });
    expect(
      getExerciseProgress(afterOne, base.date, base.weekday, base.planCreatedAt, base.exerciseId, 2),
    ).toMatchObject({ completedSets: 1, finished: false, skipped: false });

    const afterTwo = logSetDone(afterOne, {
      ...base,
      at: "2026-09-02T19:04:00.000Z",
    });
    const done = getExerciseProgress(
      afterTwo,
      base.date,
      base.weekday,
      base.planCreatedAt,
      base.exerciseId,
      2,
    );
    expect(done.completedSets).toBe(2);
    expect(done.finished).toBe(true);

    const extra = logSetDone(afterTwo, base);
    expect(
      getExerciseProgress(extra, base.date, base.weekday, base.planCreatedAt, base.exerciseId, 2)
        .completedSets,
    ).toBe(2);
  });

  it("guarda o peso opcional na série", () => {
    const next = logSetDone(empty, {
      date: "2026-09-02",
      weekday: "qua",
      planCreatedAt: base.planCreatedAt,
      exerciseId: "bench-press",
      plannedSets: 3,
      load: "40kg",
      at: "2026-09-02T19:10:00.000Z",
    });
    expect(
      getExerciseProgress(
        next,
        "2026-09-02",
        "qua",
        base.planCreatedAt,
        "bench-press",
        3,
      ).load,
    ).toBe("40kg");
  });

  it("pula o exercício e deixa desfazer", () => {
    const skipped = logExerciseSkipped(empty, {
      ...base,
      at: "2026-09-02T19:20:00.000Z",
    });
    expect(
      getExerciseProgress(
        skipped,
        base.date,
        base.weekday,
        base.planCreatedAt,
        base.exerciseId,
        2,
      ),
    ).toMatchObject({ skipped: true, finished: true });

    const cleared = undoExerciseSession(skipped, base);
    expect(
      getExerciseProgress(
        cleared,
        base.date,
        base.weekday,
        base.planCreatedAt,
        base.exerciseId,
        2,
      ).finished,
    ).toBe(false);
  });

  it("resume a semana e o período do check-in", () => {
    const plan = {
      ...generateWeeklyPlan(PLANNER_DEFAULTS),
      createdAt: "2026-08-01T12:00:00.000Z",
    };
    let state = empty;
    const wednesdayDay = plan.days.find((day) => day.day === "qua");
    const first = wednesdayDay?.exercises[0];
    const second = wednesdayDay?.exercises[1];
    if (first) {
      state = logExerciseSkipped(state, {
        date: "2026-09-02",
        weekday: "qua",
        planCreatedAt: plan.createdAt,
        exerciseId: first.exerciseId,
        at: "2026-09-02T19:00:00.000Z",
      });
    }
    if (second) {
      state = logSetDone(state, {
        date: "2026-09-02",
        weekday: "qua",
        planCreatedAt: plan.createdAt,
        exerciseId: second.exerciseId,
        plannedSets: second.sets,
        at: "2026-09-02T19:12:00.000Z",
      });
    }

    const now = new Date("2026-09-02T20:00:00");
    const week = weekProgress(plan, state, now);
    const wednesday = week.find((day) => day.weekday === "qua");
    expect(wednesday?.isToday).toBe(true);
    expect(wednesday?.finished).toBeGreaterThanOrEqual(1);

    const stats = statsSince(state, plan.createdAt, now);
    expect(stats.trainingDays).toBe(1);
    expect(stats.skippedExercises).toBe(1);
    expect(stats.finishedExercises).toBeGreaterThanOrEqual(1);
  });
});
