import { describe, expect, it } from "vitest";
import {
  draftWorkoutEvents,
  nextOccurrence,
} from "@/lib/google/calendar";
import { PLANNER_DEFAULTS, generateWeeklyPlan } from "@/lib/planner/plan";
import {
  canRaiseLevel,
  CHECK_IN_MS,
  isCheckInDue,
  nextPlannerLevel,
  shouldSuggestRaise,
} from "@/lib/profile/check-in";
import { normalizeDisplayName } from "@/lib/profile/storage";

describe("nome de tratamento", () => {
  it("aceita apelido curto e recusa vazio", () => {
    expect(normalizeDisplayName("  Ana  ")).toBe("Ana");
    expect(normalizeDisplayName("E")).toBeNull();
    expect(normalizeDisplayName("")).toBeNull();
  });
});

describe("check-in de dois meses", () => {
  it("sobe o nível até avançado", () => {
    expect(nextPlannerLevel("Iniciante")).toBe("Intermediário");
    expect(nextPlannerLevel("Intermediário")).toBe("Avançado");
    expect(nextPlannerLevel("Avançado")).toBe("Avançado");
    expect(canRaiseLevel("Avançado")).toBe(false);
    expect(shouldSuggestRaise("Iniciante", "facil")).toBe(true);
    expect(shouldSuggestRaise("Iniciante", "adequado")).toBe(true);
    expect(shouldSuggestRaise("Iniciante", "dificil")).toBe(false);
    expect(shouldSuggestRaise("Avançado", "facil")).toBe(false);
  });

  it("só fica devido depois de 60 dias", () => {
    const created = new Date("2026-01-01T12:00:00.000Z").toISOString();
    const plan = {
      ...generateWeeklyPlan(PLANNER_DEFAULTS),
      createdAt: created,
      checkIn: { status: "pending" as const },
    };
    expect(isCheckInDue(plan, new Date("2026-01-30T12:00:00.000Z"))).toBe(false);
    expect(
      isCheckInDue(
        plan,
        new Date(Date.parse(created) + CHECK_IN_MS),
      ),
    ).toBe(true);
  });

  it("reabre o convite dois meses após a última resposta", () => {
    const plan = {
      ...generateWeeklyPlan(PLANNER_DEFAULTS),
      createdAt: "2026-01-01T12:00:00.000Z",
      checkIn: {
        status: "kept" as const,
        feeling: "adequado" as const,
        answeredAt: "2026-03-02T12:00:00.000Z",
      },
    };
    expect(isCheckInDue(plan, new Date("2026-03-10T12:00:00.000Z"))).toBe(false);
    expect(isCheckInDue(plan, new Date("2026-05-02T12:00:00.000Z"))).toBe(true);
  });

  it("volta a convidar dois meses depois de um ‘agora não’", () => {
    const plan = {
      ...generateWeeklyPlan(PLANNER_DEFAULTS),
      createdAt: "2026-01-01T12:00:00.000Z",
      checkIn: {
        status: "dismissed" as const,
        answeredAt: "2026-03-02T12:00:00.000Z",
      },
    };
    expect(isCheckInDue(plan, new Date("2026-03-10T12:00:00.000Z"))).toBe(false);
    expect(isCheckInDue(plan, new Date("2026-05-02T12:00:00.000Z"))).toBe(true);
  });
});

describe("eventos da agenda", () => {
  it("cria um evento recorrente por dia de treino, às 19h", () => {
    const now = new Date("2026-09-07T10:00:00");
    const monday = nextOccurrence("seg", now);
    expect(monday.getHours()).toBe(19);
    expect(monday.getDay()).toBe(1);

    const plan = generateWeeklyPlan(PLANNER_DEFAULTS);
    const events = draftWorkoutEvents(plan, now);
    expect(events).toHaveLength(plan.input.days.length);
    for (const event of events) {
      expect(event.summary.startsWith("Movia ·")).toBe(true);
      expect(event.recurrence[0]).toContain("COUNT=8");
      expect(event.description).toMatch(/Sugestão educacional/);
    }
  });
});
