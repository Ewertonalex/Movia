import {
  DEFAULT_SESSION_HOUR,
  DEFAULT_SESSION_MINUTE,
  nextOccurrence,
} from "@/lib/google/calendar";
import type { WeeklyPlan } from "@/lib/types";

export const REMINDER_PREFS_KEY = "movia-reminder-prefs-v1";

export interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface UpcomingReminder {
  at: Date;
  title: string;
  body: string;
}

const DEFAULT_PREFS: ReminderPrefs = {
  enabled: false,
  hour: DEFAULT_SESSION_HOUR,
  minute: DEFAULT_SESSION_MINUTE,
};

export function clampReminderHour(hour: number): number {
  if (!Number.isFinite(hour)) return DEFAULT_SESSION_HOUR;
  return Math.min(23, Math.max(5, Math.round(hour)));
}

export function clampReminderMinute(minute: number): number {
  if (!Number.isFinite(minute)) return DEFAULT_SESSION_MINUTE;
  return Math.min(59, Math.max(0, Math.round(minute)));
}

export function formatSessionClock(hour: number, minute = 0): string {
  return `${String(clampReminderHour(hour)).padStart(2, "0")}:${String(clampReminderMinute(minute)).padStart(2, "0")}`;
}

export function parseSessionClock(
  value: string,
): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return {
    hour: clampReminderHour(Number(match[1])),
    minute: clampReminderMinute(Number(match[2])),
  };
}

export function shouldUseDeviceReminder(plan: WeeklyPlan | null): boolean {
  return Boolean(plan && !plan.calendarSyncedAt);
}

export function loadReminderPrefs(): ReminderPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(REMINDER_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      enabled: parsed.enabled === true,
      hour: clampReminderHour(parsed.hour ?? DEFAULT_SESSION_HOUR),
      minute: clampReminderMinute(parsed.minute ?? DEFAULT_SESSION_MINUTE),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveReminderPrefs(prefs: ReminderPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      REMINDER_PREFS_KEY,
      JSON.stringify({
        enabled: prefs.enabled,
        hour: clampReminderHour(prefs.hour),
        minute: clampReminderMinute(prefs.minute),
      }),
    );
  } catch {
    // armazenamento indisponível
  }
}

const listeners = new Set<() => void>();
let snapshot: ReminderPrefs | undefined;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeToReminderPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getReminderPrefsSnapshot(): ReminderPrefs {
  if (snapshot === undefined) snapshot = loadReminderPrefs();
  return snapshot;
}

export function getServerReminderPrefs(): ReminderPrefs {
  return DEFAULT_PREFS;
}

export function publishReminderPrefs(prefs: ReminderPrefs): void {
  snapshot = {
    enabled: prefs.enabled,
    hour: clampReminderHour(prefs.hour),
    minute: clampReminderMinute(prefs.minute),
  };
  saveReminderPrefs(snapshot);
  emit();
}

export function nextTrainingReminder(
  plan: WeeklyPlan,
  hour = DEFAULT_SESSION_HOUR,
  now = new Date(),
  minute = DEFAULT_SESSION_MINUTE,
): UpcomingReminder | null {
  const sessions = plan.days.filter(
    (day) => !day.rest && day.exercises.length > 0,
  );
  if (sessions.length === 0) return null;

  let soonest: UpcomingReminder | null = null;
  for (const day of sessions) {
    const at = nextOccurrence(
      day.day,
      now,
      clampReminderHour(hour),
      clampReminderMinute(minute),
    );
    if (!soonest || at.getTime() < soonest.at.getTime()) {
      const focus = day.focus?.join(" · ");
      soonest = {
        at,
        title: "MOVIA",
        body: [
          day.sessionLabel ?? "Treino",
          focus,
          "Horário do treino neste aparelho",
        ]
          .filter(Boolean)
          .join(" · "),
      };
    }
  }
  return soonest;
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showWorkoutNotification(reminder: UpcomingReminder): boolean {
  if (!notificationsSupported() || Notification.permission !== "granted") {
    return false;
  }
  try {
    const note = new Notification(reminder.title, {
      body: reminder.body,
      tag: "movia-treino",
      lang: "pt-BR",
    });
    note.onclick = () => {
      window.focus();
      note.close();
    };
    return true;
  } catch {
    return false;
  }
}
