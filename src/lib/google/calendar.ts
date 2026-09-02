import { WEEKDAYS } from "@/lib/planner/plan";
import type { WeekdayKey, WeeklyPlan } from "@/lib/types";

const JS_WEEKDAY: Record<WeekdayKey, number> = {
  dom: 0,
  seg: 1,
  ter: 2,
  qua: 3,
  qui: 4,
  sex: 5,
  sab: 6,
};

/** Horário padrão dos treinos — a pessoa escolhe outro na Rotina. */
export const DEFAULT_SESSION_HOUR = 19;
export const DEFAULT_SESSION_MINUTE = 0;

/** Oito semanas ≈ os dois meses do check-in. */
export const CALENDAR_WEEK_COUNT = 8;

export interface CalendarEventDraft {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  recurrence: string[];
}

function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function nextOccurrence(
  day: WeekdayKey,
  now = new Date(),
  hour = DEFAULT_SESSION_HOUR,
  minute = DEFAULT_SESSION_MINUTE,
): Date {
  const target = JS_WEEKDAY[day];
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(hour, minute, 0, 0);

  const delta = (target - now.getDay() + 7) % 7;
  if (delta === 0 && now.getTime() >= next.getTime()) {
    next.setDate(next.getDate() + 7);
    return next;
  }
  next.setDate(next.getDate() + delta);
  return next;
}

export function draftWorkoutEvents(
  plan: WeeklyPlan,
  now = new Date(),
  hour = DEFAULT_SESSION_HOUR,
  minute = DEFAULT_SESSION_MINUTE,
): CalendarEventDraft[] {
  const timeZone = localTimeZone();
  const minutes = plan.input.minutes;

  return plan.days
    .filter((day) => !day.rest && day.exercises.length > 0)
    .map((day) => {
      const start = nextOccurrence(day.day, now, hour, minute);
      const end = new Date(start.getTime() + minutes * 60 * 1000);
      const weekday = WEEKDAYS.find((item) => item.key === day.day);
      const exercises = day.exercises
        .map(
          (exercise) =>
            `• ${exercise.name} — ${exercise.sets} × ${exercise.reps}`,
        )
        .join("\n");

      return {
        summary: `Movia · ${day.sessionLabel ?? "Treino"}`,
        description: [
          weekday?.full ?? day.label,
          day.focus?.length ? `Foco: ${day.focus.join(", ")}` : "",
          exercises,
          "",
          "Sugestão educacional do MOVIA. Não é diagnóstico nem prescrição clínica.",
        ]
          .filter((line) => line !== "")
          .join("\n"),
        start: { dateTime: formatLocalDateTime(start), timeZone },
        end: { dateTime: formatLocalDateTime(end), timeZone },
        recurrence: [`RRULE:FREQ=WEEKLY;COUNT=${CALENDAR_WEEK_COUNT}`],
      };
    });
}

function googleCalendarError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: {
        message?: string;
        status?: string;
        errors?: { reason?: string }[];
      };
    };
    const reason =
      parsed.error?.errors?.[0]?.reason ?? parsed.error?.status ?? "";
    const detail = parsed.error?.message ?? "";

    if (
      reason === "accessNotConfigured" ||
      detail.includes("has not been used") ||
      detail.includes("is disabled")
    ) {
      return "A API da Agenda ainda não está ativa neste projeto. Espere um minuto e tente de novo.";
    }
    if (
      reason === "insufficientPermissions" ||
      reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT" ||
      detail.toLowerCase().includes("insufficient")
    ) {
      return "O Google entrou, mas não liberou a agenda. Na janela de permissão, deixe marcado o Calendar e confirme.";
    }
    if (status === 403 && detail) {
      return `O Google recusou criar o evento: ${detail}`;
    }
  } catch {
    // corpo não-JSON
  }
  return status === 403
    ? "O Google recusou criar o evento. Confira se a API da Agenda está ligada e se você autorizou o Calendar na janela de permissão."
    : `Não conseguimos criar o evento na agenda (${status}). ${body.slice(0, 180)}`;
}

export async function insertCalendarEvents(
  accessToken: string,
  events: CalendarEventDraft[],
): Promise<number> {
  let created = 0;
  for (const event of events) {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      },
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(googleCalendarError(response.status, body));
    }
    created += 1;
  }
  return created;
}
